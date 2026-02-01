#!/usr/bin/env python3
"""
LocalStorage to MongoDB Migration Utility
==========================================

Migrates localStorage data exports (JSON) into MongoDB for UniVerse AI.

Supports migration of:
- Saved prompts (universe_saved_prompts)
- Chat history (universe_chat_history)
- User preferences (universe_theme, universe_model, universe_api_key)

Usage:
    python migrate_localStorage_to_mongodb.py --user-email user@example.com --input data.json
    python migrate_localStorage_to_mongodb.py --user-id 507f1f77bcf86cd799439011 --input data.json --dry-run
"""

import argparse
import json
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

from bson import ObjectId
from pymongo import MongoClient
from database.config import db_connection
from database.operations import (
    get_user_by_email,
    save_prompt,
    save_chat_message,
    update_user_preferences,
    save_api_key
)


class MigrationReport:
    """Track migration statistics and results"""
    
    def __init__(self):
        self.prompts_migrated = 0
        self.prompts_failed = 0
        self.chats_migrated = 0
        self.chats_failed = 0
        self.preferences_migrated = 0
        self.preferences_failed = 0
        self.errors: List[str] = []
        self.warnings: List[str] = []
        
    def add_success(self, category: str):
        if category == 'prompt':
            self.prompts_migrated += 1
        elif category == 'chat':
            self.chats_migrated += 1
        elif category == 'preference':
            self.preferences_migrated += 1
            
    def add_failure(self, category: str, error: str):
        if category == 'prompt':
            self.prompts_failed += 1
        elif category == 'chat':
            self.chats_failed += 1
        elif category == 'preference':
            self.preferences_failed += 1
        self.errors.append(error)
        
    def add_warning(self, warning: str):
        self.warnings.append(warning)
        
    def print_report(self):
        print("\n" + "="*60)
        print("MIGRATION REPORT")
        print("="*60)
        print(f"\n📊 Prompts:")
        print(f"   ✅ Migrated: {self.prompts_migrated}")
        print(f"   ❌ Failed:   {self.prompts_failed}")
        
        print(f"\n💬 Chat History:")
        print(f"   ✅ Migrated: {self.chats_migrated}")
        print(f"   ❌ Failed:   {self.chats_failed}")
        
        print(f"\n⚙️  Preferences:")
        print(f"   ✅ Migrated: {self.preferences_migrated}")
        print(f"   ❌ Failed:   {self.preferences_failed}")
        
        if self.warnings:
            print(f"\n⚠️  Warnings ({len(self.warnings)}):")
            for warning in self.warnings[:5]:  # Show first 5
                print(f"   - {warning}")
            if len(self.warnings) > 5:
                print(f"   ... and {len(self.warnings) - 5} more")
        
        if self.errors:
            print(f"\n❌ Errors ({len(self.errors)}):")
            for error in self.errors[:5]:  # Show first 5
                print(f"   - {error}")
            if len(self.errors) > 5:
                print(f"   ... and {len(self.errors) - 5} more")
        
        total_success = self.prompts_migrated + self.chats_migrated + self.preferences_migrated
        total_failed = self.prompts_failed + self.chats_failed + self.preferences_failed
        
        print(f"\n📈 Total Summary:")
        print(f"   ✅ Total Migrated: {total_success}")
        print(f"   ❌ Total Failed:   {total_failed}")
        print("="*60 + "\n")


class LocalStorageMigrator:
    """Handles migration of localStorage data to MongoDB"""
    
    def __init__(self, user_id: str, dry_run: bool = False):
        self.user_id = user_id
        self.dry_run = dry_run
        self.report = MigrationReport()
        
    def validate_localStorage_data(self, data: Dict) -> bool:
        """Validate the structure of localStorage export"""
        if not isinstance(data, dict):
            print("❌ Invalid format: Expected a JSON object")
            return False
            
        # Check for at least one recognizable key
        recognized_keys = [
            'universe_saved_prompts',
            'universe_chat_history',
            'universe_theme',
            'universe_model',
            'universe_api_key'
        ]
        
        has_data = any(key in data for key in recognized_keys)
        if not has_data:
            self.report.add_warning("No recognized localStorage keys found in export")
            
        return True
        
    def migrate_saved_prompts(self, prompts_data: Any):
        """Migrate saved prompts to MongoDB"""
        if not prompts_data:
            return
            
        if not isinstance(prompts_data, list):
            self.report.add_warning("universe_saved_prompts is not a list, skipping")
            return
            
        print(f"📚 Migrating {len(prompts_data)} saved prompts...")
        
        for idx, prompt in enumerate(prompts_data):
            try:
                # Validate prompt structure
                if not isinstance(prompt, dict):
                    self.report.add_failure('prompt', f"Prompt {idx} is not a dict")
                    continue
                
                # Extract fields with fallbacks
                title = prompt.get('prompt', prompt.get('title', f'Untitled Prompt {idx}'))
                content = prompt.get('response', prompt.get('content', ''))
                description = prompt.get('prompt', '')
                category = prompt.get('category', 'general')
                tags = prompt.get('tags', [])
                is_favorite = prompt.get('favorite', False)
                model_preference = prompt.get('model', None)
                
                # Ensure tags is a list
                if not isinstance(tags, list):
                    tags = []
                
                if self.dry_run:
                    print(f"   [DRY RUN] Would migrate: {title[:50]}...")
                else:
                    # Save to database
                    prompt_id = save_prompt(
                        user_id=self.user_id,
                        title=title[:100],  # Limit title length
                        content=content,
                        description=description,
                        category=category,
                        tags=tags,
                        is_public=False,
                        model_preference=model_preference,
                        temperature=None
                    )
                    
                    if prompt_id:
                        self.report.add_success('prompt')
                    else:
                        self.report.add_failure('prompt', f"Failed to save prompt: {title[:50]}")
                        
            except Exception as e:
                self.report.add_failure('prompt', f"Error migrating prompt {idx}: {str(e)}")
                
    def migrate_chat_history(self, chat_data: Any):
        """Migrate chat history to MongoDB"""
        if not chat_data:
            return
            
        # Handle both list of chats and list of messages
        if isinstance(chat_data, list):
            print(f"💬 Migrating {len(chat_data)} chat sessions...")
            
            for idx, chat in enumerate(chat_data):
                try:
                    if not isinstance(chat, dict):
                        continue
                        
                    # Check if it's a chat session or message list
                    messages = chat.get('messages', [])
                    session_id = chat.get('id', f'migrated_{idx}_{int(datetime.utcnow().timestamp())}')
                    title = chat.get('title', f'Chat {idx}')
                    
                    if not messages:
                        continue
                        
                    # Migrate each message
                    for msg in messages:
                        if not isinstance(msg, dict):
                            continue
                            
                        role = msg.get('role', 'user')
                        content = msg.get('content', '')
                        
                        if not content:
                            continue
                            
                        if self.dry_run:
                            print(f"   [DRY RUN] Would migrate message in session {session_id}")
                        else:
                            success = save_chat_message(
                                user_id=self.user_id,
                                session_id=session_id,
                                role=role,
                                content=content,
                                model_used=None
                            )
                            
                            if success:
                                self.report.add_success('chat')
                            else:
                                self.report.add_failure('chat', f"Failed to save message in {session_id}")
                                
                except Exception as e:
                    self.report.add_failure('chat', f"Error migrating chat {idx}: {str(e)}")
                    
    def migrate_preferences(self, data: Dict):
        """Migrate user preferences to MongoDB"""
        preferences = {}
        has_preferences = False
        
        # Theme preference
        if 'universe_theme' in data:
            theme_value = data['universe_theme']
            if theme_value:
                preferences['theme'] = {'mode': theme_value}
                has_preferences = True
                
        # Model preference
        if 'universe_model' in data:
            model_value = data['universe_model']
            if model_value:
                preferences['model'] = {'default_model': model_value}
                has_preferences = True
                
        if has_preferences:
            print("⚙️  Migrating user preferences...")
            try:
                if self.dry_run:
                    print(f"   [DRY RUN] Would migrate preferences: {preferences}")
                else:
                    success = update_user_preferences(self.user_id, preferences)
                    if success:
                        self.report.add_success('preference')
                    else:
                        self.report.add_failure('preference', "Failed to update preferences")
            except Exception as e:
                self.report.add_failure('preference', f"Error migrating preferences: {str(e)}")
                
        # API Key (encrypted storage)
        if 'universe_api_key' in data:
            api_key = data['universe_api_key']
            if api_key and isinstance(api_key, str):
                print("🔑 Migrating API key (encrypted)...")
                try:
                    if self.dry_run:
                        print(f"   [DRY RUN] Would migrate API key")
                    else:
                        success = save_api_key(
                            user_id=self.user_id,
                            key_name='openrouter',
                            key_value=api_key
                        )
                        if success:
                            self.report.add_success('preference')
                        else:
                            self.report.add_failure('preference', "Failed to save API key")
                except Exception as e:
                    self.report.add_failure('preference', f"Error migrating API key: {str(e)}")
                    
    def migrate(self, data: Dict):
        """Main migration function"""
        print(f"\n🚀 Starting migration for user: {self.user_id}")
        if self.dry_run:
            print("   [DRY RUN MODE - No data will be written]")
        print()
        
        # Validate data
        if not self.validate_localStorage_data(data):
            return False
            
        # Migrate saved prompts
        if 'universe_saved_prompts' in data:
            self.migrate_saved_prompts(data['universe_saved_prompts'])
            
        # Migrate chat history
        if 'universe_chat_history' in data:
            self.migrate_chat_history(data['universe_chat_history'])
            
        # Migrate preferences
        self.migrate_preferences(data)
        
        # Print report
        self.report.print_report()
        
        return True


def get_user_id_from_email(email: str) -> Optional[str]:
    """Get user ObjectId from email"""
    try:
        user = get_user_by_email(email)
        if user:
            return str(user['_id'])
        return None
    except Exception as e:
        print(f"❌ Error fetching user by email: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(
        description='Migrate localStorage data to MongoDB',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Migrate using email
  python migrate_localStorage_to_mongodb.py --user-email user@example.com --input export.json
  
  # Dry run (preview without writing)
  python migrate_localStorage_to_mongodb.py --user-email user@example.com --input export.json --dry-run
  
  # Migrate using user ID directly
  python migrate_localStorage_to_mongodb.py --user-id 507f1f77bcf86cd799439011 --input export.json
        """
    )
    
    parser.add_argument('--user-email', help='User email address')
    parser.add_argument('--user-id', help='MongoDB User ObjectId (alternative to --user-email)')
    parser.add_argument('--input', '-i', required=True, help='Path to localStorage JSON export file')
    parser.add_argument('--dry-run', action='store_true', help='Preview migration without writing to database')
    
    args = parser.parse_args()
    
    # Validate arguments
    if not args.user_email and not args.user_id:
        print("❌ Error: Must provide either --user-email or --user-id")
        sys.exit(1)
        
    # Get user ID
    if args.user_email:
        print(f"🔍 Looking up user: {args.user_email}...")
        user_id = get_user_id_from_email(args.user_email)
        if not user_id:
            print(f"❌ User not found: {args.user_email}")
            sys.exit(1)
        print(f"✅ Found user ID: {user_id}")
    else:
        user_id = args.user_id
        # Validate ObjectId format
        try:
            ObjectId(user_id)
        except Exception:
            print(f"❌ Invalid ObjectId format: {user_id}")
            sys.exit(1)
    
    # Load input file
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ Input file not found: {args.input}")
        sys.exit(1)
        
    print(f"📂 Loading data from: {args.input}...")
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)
        
    # Run migration
    migrator = LocalStorageMigrator(user_id, dry_run=args.dry_run)
    success = migrator.migrate(data)
    
    if success:
        print("✅ Migration completed!")
        sys.exit(0)
    else:
        print("❌ Migration failed!")
        sys.exit(1)


if __name__ == '__main__':
    main()
