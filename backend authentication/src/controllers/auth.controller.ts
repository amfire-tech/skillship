import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../config/supabase";

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const MAX_FAILED_ATTEMPTS = 5;

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
  const { user_id, password, role } = req.body;

  if (!user_id || !password || !role) {
    res.status(400).json({ message: "user_id, password and role are required" });
    return;
  }

  // Step 1: Find user by user_id, fall back to email
  let { data: users, error } = await supabase
    .from("user_auth")
    .select("*")
    .eq("user_id", user_id)
    .limit(1);

  if (error) {
    res.status(500).json({ message: "Database error", detail: error.message });
    return;
  }

  if (!users || users.length === 0) {
    const { data: byEmail, error: emailError } = await supabase
      .from("user_auth")
      .select("*")
      .eq("email", user_id)
      .limit(1);

    if (emailError) {
      res.status(500).json({ message: "Database error", detail: emailError.message });
      return;
    }

    users = byEmail;
  }

  if (!users || users.length === 0) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const user = users[0];

  // Step 2: Check if account is locked
  if (user.is_locked) {
    res.status(403).json({ message: "Account is locked. Please contact your administrator." });
    return;
  }

  // Step 3: Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
    const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

    await supabase
      .from("user_auth")
      .update({
        failed_login_attempts: newFailedAttempts,
        is_locked: shouldLock,
      })
      .eq("user_id", user_id);

    if (shouldLock) {
      res.status(403).json({ message: "Account locked after too many failed attempts." });
    } else {
      res.status(401).json({
        message: "Invalid password",
        attempts_remaining: MAX_FAILED_ATTEMPTS - newFailedAttempts,
      });
    }
    return;
  }

  // Step 4: Check selected role matches DB role
  if (role !== user.role) {
    res.status(401).json({ message: "Selected role does not match your account role." });
    return;
  }

  // Step 5: Generate tokens
  const accessToken = jwt.sign(
    { user_id: user.user_id, role: user.role, school_id: user.school_id },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

  // Step 6: Update last_login_at, reset failed attempts, store refresh token hash
  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("user_auth")
    .update({
      last_login_at: new Date().toISOString(),
      failed_login_attempts: 0,
      refresh_token_hash: refreshTokenHash,
      token_expires_at: tokenExpiresAt,
    })
    .eq("user_id", user_id);

  res.status(200).json({
    user: {
      id: user.id,
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      school_id: user.school_id,
    },
    accessToken,
    refreshToken,
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
  const user_id = (req as any).user?.user_id;

  await supabase
    .from("user_auth")
    .update({ refresh_token_hash: null })
    .eq("user_id", user_id);

  res.status(200).json({ message: "Logged out successfully" });
}

// ─── Refresh ──────────────────────────────────────────────────────────────────
export async function refresh(req: Request, res: Response): Promise<void> {
  const { user_id, refreshToken } = req.body;

  if (!user_id || !refreshToken) {
    res.status(400).json({ message: "user_id and refreshToken are required" });
    return;
  }

  const { data: users, error } = await supabase
    .from("user_auth")
    .select("*")
    .eq("user_id", user_id)
    .limit(1);

  if (error || !users || users.length === 0) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const user = users[0];

  if (!user.refresh_token_hash) {
    res.status(401).json({ message: "No active session. Please login again." });
    return;
  }

  const tokenMatch = await bcrypt.compare(refreshToken, user.refresh_token_hash);

  if (!tokenMatch) {
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }

  // Issue new access token
  const newAccessToken = jwt.sign(
    { user_id: user.user_id, role: user.role, school_id: user.school_id },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  res.status(200).json({ accessToken: newAccessToken });
}
