import { supabase } from "./supabase";

async function testConnection() {
  console.log("Testing Supabase connection...");

  const { data, error } = await supabase
    .from("user_auth")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }

  console.log("Supabase connected successfully!");
  console.log("user_auth table is accessible. Rows returned:", data?.length ?? 0);
  process.exit(0);
}

testConnection();
