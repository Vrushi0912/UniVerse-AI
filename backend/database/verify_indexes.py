"""
MongoDB Index Verification Script for UniVerse AI
Checks all existing indexes
"""
from database.config import db_connection
import json

def verify_indexes():
    """Verify all collection indexes"""
    
    try:
        # Test connection
        db_connection.client.admin.command('ping')
        db = db_connection.db
    except Exception as e:
        print(f"❌ Database not connected: {str(e)}")
        return False
    
    print("🔍 Verifying MongoDB indexes for UniVerse AI...\n")
    
    collections = [
        'users', 
        'user_sessions', 
        'chat_history', 
        'saved_prompts', 
        'user_preferences', 
        'analytics'
    ]
    
    total_indexes = 0
    index_details = {}
    
    for coll_name in collections:
        try:
            collection = db[coll_name]
            indexes = list(collection.list_indexes())
            index_count = len(indexes)
            total_indexes += index_count
            
            print(f"📊 {coll_name}: {index_count} indexes")
            
            index_details[coll_name] = []
            for idx in indexes:
                idx_name = idx['name']
                idx_keys = idx.get('key', {})
                idx_unique = idx.get('unique', False)
                idx_sparse = idx.get('sparse', False)
                idx_ttl = idx.get('expireAfterSeconds', None)
                
                # Format index info
                keys_str = ', '.join([f"{k}:{v}" for k, v in idx_keys.items()])
                flags = []
                if idx_unique:
                    flags.append('unique')
                if idx_sparse:
                    flags.append('sparse')
                if idx_ttl:
                    flags.append(f'TTL:{idx_ttl}s')
                
                flags_str = f" [{', '.join(flags)}]" if flags else ""
                
                print(f"  ✓ {idx_name}: {keys_str}{flags_str}")
                index_details[coll_name].append({
                    'name': idx_name,
                    'keys': keys_str,
                    'unique': idx_unique,
                    'sparse': idx_sparse,
                    'ttl': idx_ttl
                })
                
        except Exception as e:
            print(f"  ❌ Error checking {coll_name}: {str(e)}")
    
    print(f"\n📈 Summary:")
    print(f"  Total collections: {len(collections)}")
    print(f"  Total indexes: {total_indexes}")
    print(f"  Average indexes per collection: {total_indexes / len(collections):.1f}")
    
    # Check for recommended indexes
    print(f"\n✅ Index Coverage:")
    
    required_indexes = {
        'users': ['idx_email_unique', 'idx_created_at', 'idx_last_login'],
        'user_sessions': ['idx_session_token_unique', 'idx_expires_at_ttl'],
        'chat_history': ['idx_session_id_unique', 'idx_user_updated'],
        'saved_prompts': ['idx_prompt_id_unique', 'idx_user_created'],
        'user_preferences': ['idx_user_id_unique'],
        'analytics': ['idx_timestamp', 'idx_timestamp_ttl']
    }
    
    missing_indexes = []
    for coll, required in required_indexes.items():
        existing = [idx['name'] for idx in index_details.get(coll, [])]
        missing = [idx for idx in required if idx not in existing]
        if missing:
            missing_indexes.append((coll, missing))
            print(f"  ⚠️  {coll}: Missing {len(missing)} indexes: {', '.join(missing)}")
        else:
            print(f"  ✅ {coll}: All required indexes present")
    
    if not missing_indexes:
        print(f"\n🎉 All recommended indexes are in place!")
    else:
        print(f"\n⚠️  Some recommended indexes are missing. Run setup_indexes.py to create them.")
    
    return True

if __name__ == "__main__":
    verify_indexes()
