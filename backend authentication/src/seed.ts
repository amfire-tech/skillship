import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { supabase } from "./config/supabase";

dotenv.config();

const users = [
  { user_id: "admin",     password: "admin123",     role: "Super Admin", email: "aryan.gupta@skillship.in" },
  { user_id: "subadmin",  password: "subadmin123",  role: "Sub Admin",   email: "neha.verma@skillship.in" },
  { user_id: "principal", password: "principal123", role: "Principal",   email: "priya.sharma@school.edu.in" },
  { user_id: "teacher",   password: "teacher123",   role: "Teacher",     email: "rahul.iyer@school.edu.in" },
  { user_id: "student",   password: "student123",   role: "Student",     email: "ananya.kapoor@student.edu.in" },
];

async function seed() {
  console.log("Seeding user_auth table...");

  for (const u of users) {
    const password_hash = await bcrypt.hash(u.password, 10);

    const { error } = await supabase
      .from("user_auth")
      .upsert(
        { user_id: u.user_id, email: u.email, password_hash, role: u.role, is_locked: false, failed_login_attempts: 0 },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error(`Failed to seed ${u.user_id}:`, error.message);
    } else {
      console.log(`Seeded: ${u.user_id} (${u.role})`);
    }
  }

  console.log("Done.");
  process.exit(0);
}

seed();
