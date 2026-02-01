from database.operations import create_user, save_chat_message, get_users_collection
import time

EMAIL = "ganesh@gmail.com"
NAME = "ganesh"
PASSWORD = "password123" # Temporary password

print(f"--- Restoring User '{NAME}' to MongoDB ---")

# 1. Check if already exists (cleanup from previous attempts)
users = get_users_collection()
existing = users.find_one({"email": EMAIL})
if existing:
    print(f"User {EMAIL} already exists in DB. Deleting to recreate fresh...")
    users.delete_one({"_id": existing["_id"]})

# 2. Create User
print("Creating user profile...")
user_id = create_user(EMAIL, PASSWORD, NAME)

if not user_id:
    print("Failed to create user.")
    exit()

print(f"User created! ID: {user_id}")
print(f"   Email: {EMAIL}")
print(f"   Password: {PASSWORD}")

# 3. Create Sample Chat Data
print("\nCreating sample chat history...")
from datetime import datetime

session_id = f"restored_session_{int(time.time())}"
save_chat_message(
    user_id=user_id,
    session_id=session_id,
    role="user",
    content="Create a diagram of how HTTPS works",
    model_used="meta-llama/llama-3.2-3b-instruct:free"
)
save_chat_message(
    user_id=user_id,
    session_id=session_id,
    role="assistant",
    content="Here is a diagram explaining the HTTPS handshake process...",
    model_used="meta-llama/llama-3.2-3b-instruct:free"
)

print(f"Created chat session: {session_id}")
print("\n--- Restore Complete ---")
print("Run 'view_user_data.py' to verify.")
