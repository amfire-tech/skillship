from config.supabase_client import supabase


def test_connection():
    print("Testing Supabase connection...")

    response = supabase.from_("user_auth").select("id").limit(1).execute()

    if hasattr(response, "error") and response.error:
        print("Connection failed:", response.error.message)
        raise SystemExit(1)

    print("Supabase connected successfully!")
    print("user_auth table is accessible. Rows returned:", len(response.data or []))


if __name__ == "__main__":
    test_connection()
