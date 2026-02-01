"""
Test Suite for Saved Prompts and User Preferences CRUD Operations
===================================================================

Tests database operations for:
- Saved prompts (create, read, update, delete)
- User preferences (theme, model, API keys)

Run with: pytest test_saved_prompts.py -v
"""

import pytest
from datetime import datetime
from bson import ObjectId

from database.config import db_connection
from database.operations import (
    create_user,
    save_prompt,
    get_user_saved_prompts,
    update_saved_prompt,
    delete_saved_prompt,
    increment_prompt_view,
    get_user_preferences,
    update_user_preferences,
    save_api_key,
    get_api_key
)


# Test database name
TEST_DB_NAME = "universe_ai_test"


@pytest.fixture(scope='module', autouse=True)
def setup_test_database():
    """Setup and teardown test database"""
    # Switch to test database
    original_db = db_connection.db
    db_connection.db = db_connection.client[TEST_DB_NAME]
    
    # Create text index for search tests
    db_connection.db.saved_prompts.create_index([
        ("title", "text"),
        ("content", "text"),
        ("tags", "text")
    ])
    
    yield
    
    # Cleanup: Drop test database after all tests
    db_connection.client.drop_database(TEST_DB_NAME)
    db_connection.db = original_db


@pytest.fixture
def test_user():
    """Create a test user"""
    email = f"test_{ObjectId()}@example.com"
    user_id = create_user(
        email=email,
        password="test_password_123",
        full_name="Test User"
    )
    return user_id


@pytest.fixture
def test_prompt(test_user):
    """Create a test prompt"""
    prompt_id = save_prompt(
        user_id=test_user,
        title="Test Prompt",
        content="This is a test response",
        description="Test prompt description",
        category="programming",
        tags=["test", "python"],
        is_public=False,
        model_preference="gemini-pro"
    )
    return prompt_id


class TestSavedPrompts:
    """Test saved prompts CRUD operations"""
    
    def test_create_prompt(self, test_user):
        """Test creating a new prompt"""
        prompt_id = save_prompt(
            user_id=test_user,
            title="Machine Learning Basics",
            content="ML is a subset of AI...",
            description="Explain machine learning",
            category="explanation",
            tags=["ai", "ml", "explanation"],
            is_public=False,
            model_preference="gemini-pro",
            temperature=0.7
        )
        
        assert prompt_id is not None
        assert isinstance(prompt_id, str)
        
        # Verify it was saved
        prompts = get_user_saved_prompts(test_user)
        assert len(prompts) > 0
        
        # Find our prompt
        saved_prompt = next((p for p in prompts if str(p['_id']) == prompt_id), None)
        assert saved_prompt is not None
        assert saved_prompt['title'] == "Machine Learning Basics"
        assert saved_prompt['category'] == "explanation"
        assert len(saved_prompt['tags']) == 3
        
    def test_get_user_prompts(self, test_user, test_prompt):
        """Test retrieving user's prompts"""
        prompts = get_user_saved_prompts(test_user)
        
        assert isinstance(prompts, list)
        assert len(prompts) > 0
        assert all('_id' in p for p in prompts)
        assert all('title' in p for p in prompts)
        
    def test_filter_by_category(self, test_user):
        """Test filtering prompts by category"""
        # Create prompts in different categories
        save_prompt(test_user, "Code Prompt", "code", category="programming")
        save_prompt(test_user, "Math Prompt", "math", category="math")
        
        # Filter by programming
        prog_prompts = get_user_saved_prompts(test_user, category="programming")
        assert all(p['category'] == 'programming' for p in prog_prompts)
        
        # Filter by math
        math_prompts = get_user_saved_prompts(test_user, category="math")
        assert all(p['category'] == 'math' for p in math_prompts)
        
    def test_filter_by_tag(self, test_user):
        """Test filtering prompts by tag"""
        # Create prompts with specific tags
        save_prompt(test_user, "Python Prompt", "content", tags=["python", "code"])
        save_prompt(test_user, "JS Prompt", "content", tags=["javascript", "code"])
        
        # Filter by python tag
        python_prompts = get_user_saved_prompts(test_user, tag="python")
        assert any("python" in p.get('tags', []) for p in python_prompts)
        
    def test_search_prompts(self, test_user):
        """Test searching prompts"""
        # Create prompts with searchable content
        save_prompt(test_user, "Machine Learning Guide", "content about ML")
        save_prompt(test_user, "Deep Learning Tutorial", "content about DL")
        
        # Search for "learning"
        results = get_user_saved_prompts(test_user, search="learning")
        assert len(results) >= 2
        
    def test_favorite_filter(self, test_user):
        """Test filtering favorite prompts"""
        # Create favorite and non-favorite prompts
        fav_id = save_prompt(test_user, "Favorite", "content")
        update_saved_prompt(fav_id, test_user, {'is_favorite': True})
        
        regular_id = save_prompt(test_user, "Regular", "content")
        
        # Filter favorites only
        favorites = get_user_saved_prompts(test_user, is_favorite=True)
        assert all(p.get('is_favorite', False) for p in favorites)
        assert any(str(p['_id']) == fav_id for p in favorites)
        assert not any(str(p['_id']) == regular_id for p in favorites)
        
    def test_pagination(self, test_user):
        """Test pagination of prompts"""
        # Create multiple prompts
        for i in range(15):
            save_prompt(test_user, f"Prompt {i}", f"content {i}")
        
        # Get first page
        page1 = get_user_saved_prompts(test_user, limit=5, skip=0)
        assert len(page1) == 5
        
        # Get second page
        page2 = get_user_saved_prompts(test_user, limit=5, skip=5)
        assert len(page2) == 5
        
        # Ensure different prompts
        page1_ids = {str(p['_id']) for p in page1}
        page2_ids = {str(p['_id']) for p in page2}
        assert page1_ids.isdisjoint(page2_ids)
        
    def test_update_prompt(self, test_user, test_prompt):
        """Test updating a prompt"""
        # Update the prompt
        success = update_saved_prompt(
            prompt_id=test_prompt,
            user_id=test_user,
            updates={
                'title': 'Updated Title',
                'is_favorite': True,
                'tags': ['updated', 'test']
            }
        )
        
        assert success is True
        
        # Verify update
        prompts = get_user_saved_prompts(test_user)
        updated = next((p for p in prompts if str(p['_id']) == test_prompt), None)
        assert updated is not None
        assert updated['title'] == 'Updated Title'
        assert updated['is_favorite'] is True
        assert 'updated' in updated['tags']
        
    def test_update_invalid_fields(self, test_user, test_prompt):
        """Test that invalid fields are not updated"""
        # Try to update with invalid field
        success = update_saved_prompt(
            prompt_id=test_prompt,
            user_id=test_user,
            updates={
                'invalid_field': 'value',
                'title': 'Valid Update'
            }
        )
        
        assert success is True
        
        # Verify only valid fields updated
        prompts = get_user_saved_prompts(test_user)
        updated = next((p for p in prompts if str(p['_id']) == test_prompt), None)
        assert updated['title'] == 'Valid Update'
        assert 'invalid_field' not in updated
        
    def test_update_nonexistent_prompt(self, test_user):
        """Test updating a prompt that doesn't exist"""
        fake_id = str(ObjectId())
        success = update_saved_prompt(
            prompt_id=fake_id,
            user_id=test_user,
            updates={'title': 'New Title'}
        )
        
        assert success is False
        
    def test_update_other_users_prompt(self, test_user, test_prompt):
        """Test that users cannot update other users' prompts"""
        # Create another user
        other_user = create_user("other@example.com", "hash", "Other User")
        
        # Try to update first user's prompt as other user
        success = update_saved_prompt(
            prompt_id=test_prompt,
            user_id=other_user,
            updates={'title': 'Hacked Title'}
        )
        
        assert success is False
        
    def test_delete_prompt(self, test_user, test_prompt):
        """Test deleting a prompt"""
        # Delete the prompt
        success = delete_saved_prompt(test_prompt, test_user)
        assert success is True
        
        # Verify deletion
        prompts = get_user_saved_prompts(test_user)
        deleted = next((p for p in prompts if str(p['_id']) == test_prompt), None)
        assert deleted is None
        
    def test_delete_nonexistent_prompt(self, test_user):
        """Test deleting a prompt that doesn't exist"""
        fake_id = str(ObjectId())
        success = delete_saved_prompt(fake_id, test_user)
        assert success is False
        
    def test_delete_other_users_prompt(self, test_user, test_prompt):
        """Test that users cannot delete other users' prompts"""
        # Create another user
        other_user = create_user("other2@example.com", "hash", "Other User 2")
        
        # Try to delete first user's prompt as other user
        success = delete_saved_prompt(test_prompt, other_user)
        assert success is False
        
        # Verify prompt still exists
        prompts = get_user_saved_prompts(test_user)
        still_exists = next((p for p in prompts if str(p['_id']) == test_prompt), None)
        assert still_exists is not None
        
    def test_increment_view_count(self, test_user, test_prompt):
        """Test incrementing prompt view count"""
        # Get initial count
        initial_prompts = get_user_saved_prompts(test_user)
        initial = next((p for p in initial_prompts if str(p['_id']) == test_prompt), None)
        initial_count = initial.get('usage_count', 0)
        
        # Increment view
        success = increment_prompt_view(test_prompt)
        assert success is True
        
        # Verify increment
        updated_prompts = get_user_saved_prompts(test_user)
        updated = next((p for p in updated_prompts if str(p['_id']) == test_prompt), None)
        assert updated['usage_count'] == initial_count + 1
        
        # Increment again
        increment_prompt_view(test_prompt)
        final_prompts = get_user_saved_prompts(test_user)
        final = next((p for p in final_prompts if str(p['_id']) == test_prompt), None)
        assert final['usage_count'] == initial_count + 2


class TestUserPreferences:
    """Test user preferences CRUD operations"""
    
    def test_get_default_preferences(self, test_user):
        """Test getting default preferences for new user"""
        prefs = get_user_preferences(test_user)
        
        assert prefs is not None
        assert 'theme' in prefs
        assert 'model' in prefs
        
    def test_update_theme_preference(self, test_user):
        """Test updating theme preference"""
        success = update_user_preferences(
            test_user,
            {'theme': {'mode': 'purple-black'}}
        )
        
        assert success is True
        
        # Verify update
        prefs = get_user_preferences(test_user)
        assert prefs['theme']['mode'] == 'purple-black'
        
    def test_update_model_preference(self, test_user):
        """Test updating model preference"""
        success = update_user_preferences(
            test_user,
            {'model': {'default_model': 'gpt-4'}}
        )
        
        assert success is True
        
        # Verify update
        prefs = get_user_preferences(test_user)
        assert prefs['model']['default_model'] == 'gpt-4'
        
    def test_update_multiple_preferences(self, test_user):
        """Test updating multiple preferences at once"""
        success = update_user_preferences(
            test_user,
            {
                'theme': {'mode': 'green-black'},
                'model': {'default_model': 'gemini-pro'},
                'ui': {'compact_mode': True}
            }
        )
        
        assert success is True
        
        # Verify all updates
        prefs = get_user_preferences(test_user)
        assert prefs['theme']['mode'] == 'green-black'
        assert prefs['model']['default_model'] == 'gemini-pro'
        assert prefs['ui']['compact_mode'] is True
        
    def test_save_api_key(self, test_user):
        """Test saving encrypted API key"""
        api_key = "dummy-test-key-1234567890abcdef"
        
        success = save_api_key(test_user, "openrouter", api_key)
        assert success is True
        
    def test_get_api_key(self, test_user):
        """Test retrieving decrypted API key"""
        # Save key first
        original_key = "dummy-test-key-0987654321fedcba"
        save_api_key(test_user, "openrouter", original_key)
        
        # Retrieve key
        retrieved_key = get_api_key(test_user, "openrouter")
        assert retrieved_key == original_key
        
    def test_get_nonexistent_api_key(self, test_user):
        """Test retrieving API key that doesn't exist"""
        key = get_api_key(test_user, "nonexistent_service")
        assert key is None
        
    def test_update_api_key(self, test_user):
        """Test updating an existing API key"""
        # Save initial key
        save_api_key(test_user, "gemini", "initial_key")
        
        # Update key
        new_key = "updated_key_123"
        save_api_key(test_user, "gemini", new_key)
        
        # Verify update
        retrieved = get_api_key(test_user, "gemini")
        assert retrieved == new_key


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
