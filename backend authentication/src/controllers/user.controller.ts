import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase";

// ─── User ID Generator ────────────────────────────────────────────────────────

async function generateUserId(
  role: string,
  school?: string,
  classGrade?: string
): Promise<string> {
  let prefix: string;

  switch (role) {
    case "subadmin":
      prefix = "SA";
      break;

    case "teacher":
      prefix = "TA";
      break;

    case "principal": {
      const letter = (school || "X").trim().charAt(0).toUpperCase();
      prefix = `P${letter}`;
      break;
    }

    case "student": {
      const letter = (school || "X").trim().charAt(0).toUpperCase();
      // e.g. "Class 9-A" → "9A", "9A" → "9A"
      const cleanClass = (classGrade || "")
        .replace(/class\s*/i, "")
        .replace(/[\s\-]/g, "")
        .toUpperCase();
      prefix = `S${letter}${cleanClass}`;
      break;
    }

    default:
      prefix = "USR";
  }

  const { count } = await supabase
    .from("user_auth")
    .select("*", { count: "exact", head: true })
    .like("user_id", `${prefix}%`);

  const serial = String((count || 0) + 1).padStart(3, "0");
  return `${prefix}${serial}`;
}

// ─── Create User ──────────────────────────────────────────────────────────────

export async function createUser(req: Request, res: Response): Promise<void> {
  const { role, full_name, email, phone, password, region, school, subject, class_grade } =
    req.body;
  const creatorUserId = (req as any).user?.user_id;

  if (!role || !full_name || !email || !phone || !password) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }

  // Get creator's super_admin_id (FK used in role tables)
  const { data: creators } = await supabase
    .from("user_auth")
    .select("id")
    .eq("user_id", creatorUserId)
    .limit(1);
  const creatorUserAuthId = creators?.[0]?.id ?? null;

  const { data: superAdmins } = creatorUserAuthId
    ? await supabase.from("super_admin").select("admin_id").eq("user_id", creatorUserAuthId).limit(1)
    : { data: null };
  const creatorId = superAdmins?.[0]?.admin_id ?? null;

  // Generate user_id
  const userId = await generateUserId(role, school, class_grade);

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const roleLabels: Record<string, string> = {
    subadmin: "Sub Admin",
    teacher: "Teacher",
    principal: "Principal",
    student: "Student",
  };
  const roleLabel = roleLabels[role] || role;

  // Insert into user_auth
  const { data: authData, error: authError } = await supabase
    .from("user_auth")
    .insert({
      user_id: userId,
      full_name,
      email,
      phone,
      password_hash: passwordHash,
      role: roleLabel,
      is_locked: false,
      failed_login_attempts: 0,
    })
    .select("id")
    .single();

  if (authError) {
    res.status(500).json({ message: "Failed to create user auth", detail: authError.message });
    return;
  }

  const userAuthId = authData.id;

  // Insert into role-specific table
  let roleError: string | null = null;

  if (role === "subadmin") {
    const { data: regions } = await supabase
      .from("region")
      .select("region_id")
      .ilike("name", `%${region || ""}%`)
      .limit(1);
    const regionId = regions?.[0]?.region_id ?? null;

    const { error } = await supabase.from("sub_admin").upsert({
      user_id: userAuthId,
      region_id: regionId,
      created_by_super_admin_id: creatorId,
      full_name,
      email,
      phone,
      is_active: true,
    }, { onConflict: "email" });
    if (error) roleError = error.message;

  } else if (role === "teacher") {
    const { data: schools } = await supabase
      .from("school")
      .select("school_id")
      .ilike("school_name", `%${school || ""}%`)
      .limit(1);
    const schoolId = schools?.[0]?.school_id ?? null;

    const { error } = await supabase.from("teacher").upsert({
      user_id: userAuthId,
      school_id: schoolId,
      full_name,
      subject_expertise: subject || null,
      is_active: true,
    }, { onConflict: "user_id" });
    if (error) roleError = error.message;

  } else if (role === "principal") {
    const { data: schools } = await supabase
      .from("school")
      .select("school_id")
      .ilike("school_name", `%${school || ""}%`)
      .limit(1);
    const schoolId = schools?.[0]?.school_id ?? null;

    const { error } = await supabase.from("principal").upsert({
      user_id: userAuthId,
      school_id: schoolId,
      full_name,
      designation: "Principal",
      is_active: true,
    }, { onConflict: "user_id" });
    if (error) roleError = error.message;

  } else if (role === "student") {
    const { data: schools } = await supabase
      .from("school")
      .select("school_id")
      .ilike("school_name", `%${school || ""}%`)
      .limit(1);
    const schoolId = schools?.[0]?.school_id ?? null;

    const { error } = await supabase.from("student").upsert({
      user_id: userAuthId,
      school_id: schoolId,
      full_name,
      class: class_grade || null,
      is_active: true,
    }, { onConflict: "user_id" });
    if (error) roleError = error.message;

  } else {
    await supabase.from("user_auth").delete().eq("id", userAuthId);
    res.status(400).json({ message: "Invalid role" });
    return;
  }

  // Rollback user_auth if role insert failed
  if (roleError) {
    await supabase.from("user_auth").delete().eq("id", userAuthId);
    res.status(500).json({ message: `Failed to create ${roleLabel}`, detail: roleError });
    return;
  }

  res.status(201).json({
    message: "User created successfully",
    user_id: userId,
    full_name,
    role: roleLabel,
  });
}
