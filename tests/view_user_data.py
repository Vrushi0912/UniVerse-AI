from database.config import db_connection, MONGODB_URI
from database.operations import get_users_collection, get_chat_history_collection, get_educational_content_collection
import pprint

# Target User
EMAIL = "ganesh@gmail.com"

print(f"--- Connection Info ---")
print(f"URI: {MONGODB_URI}")
print(f"Database: {db_connection.db.name}")
print(f"-----------------------")

print(f"--- Searching for User: {EMAIL} ---")

# 1. List All Users (Debug)
users = get_users_collection()
all_users = list(users.find({}, {"email": 1, "full_name": 1}))

print(f"Found {len(all_users)} total users in DB:")
for u in all_users:
    print(f" - {u.get('email')} ({u.get('full_name')})")

user = users.find_one({"email": EMAIL})

if not user:
    print("\nUser explicitly not found by email search.")
    # Try case insensitive search if needed, or just exit
    exit()

user_id = user["_id"]
print("\n[USER PROFILE] (Collection: users)")
pprint.pprint(user)

# 2. Find Chat History
chats = get_chat_history_collection()
user_chats = list(chats.find({"user_id": user_id}))
print(f"\n[CHAT HISTORY] (Collection: chat_history) - Found {len(user_chats)} sessions")
for chat in user_chats:
    print(f"   - Session: {chat.get('title', 'Untitled')} ({len(chat.get('messages', []))} msgs)")

# 3. Find Library Content
library = get_educational_content_collection()
user_content = list(library.find({"user_id": user_id}))
print(f"\n[LIBRARY CONTENT] (Collection: educational_content) - Found {len(user_content)} items")
for item in user_content:
    print(f"   - Topic: {item.get('topic')}")

print("\n--- End of Data ---")
