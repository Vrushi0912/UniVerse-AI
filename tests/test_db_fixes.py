import os
import sys

# Explicitly test environment loading
print("--- Testing Environment Loading ---")
from database.config import db_connection, MONGODB_URI
print(f"MONGODB_URI present: {bool(MONGODB_URI)}")

# Test 1: Pagination Signature
print("\n--- Testing Pagination Signatures ---")
from database.operations import get_user_chat_history, get_user_educational_content
import inspect

chat_sig = inspect.signature(get_user_chat_history)
edu_sig = inspect.signature(get_user_educational_content)

print(f"get_user_chat_history has 'skip': {'skip' in chat_sig.parameters}")
print(f"get_user_educational_content has 'skip': {'skip' in edu_sig.parameters}")

# Test 2: Connection Safety (Simulated)
print("\n--- Testing Connection Safety ---")
# Temporarily sabotage connection to test error handling
original_db = db_connection.db
db_connection.db = None

try:
    db_connection.get_collection('test')
    print("Failed: Should have raised RuntimeError")
except RuntimeError as e:
    print(f"Success: Raised RuntimeError as expected: {e}")
except Exception as e:
    print(f"Failed: Raised unexpected exception: {e}")
finally:
    db_connection.db = original_db

print("\n--- Verification Complete ---")
