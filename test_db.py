# test_db.py
from database.operations import create_user, authenticate_user

EMAIL = "test+automation@example.com"
PASSWORD = "password123"
FULL_NAME = "Automation Test User"

print("Starting test_db.py — will create and authenticate a test user")

# Try to authenticate first (in case test user exists)
user = authenticate_user(EMAIL, PASSWORD)
if user:
    print(f"✅ Test user already exists and authenticated: {user.get('email')}")
else:
    print("Test user not found. Creating user...")
    try:
        user_id = create_user(EMAIL, PASSWORD, FULL_NAME)
        print(f"✅ User created with ID: {user_id}")
    except Exception as e:
        print(f"❌ Error creating user: {e}")

    # Try authentication again
    user = authenticate_user(EMAIL, PASSWORD)
    if user:
        print(f"✅ Authentication successful after creation: {user.get('email')}")
    else:
        print("❌ Authentication failed after creation")

print("Finished test_db.py")
