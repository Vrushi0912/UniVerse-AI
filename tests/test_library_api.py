"""
Test Suite for Library API Endpoints
=====================================

Tests FastAPI endpoints for:
- Library/Saved Prompts API (POST, GET, PUT, DELETE)
- User Preferences API (GET, PUT, POST API keys)
- Authentication and authorization
- Input validation
- Error handling

Run with: pytest test_library_api.py -v
"""

import pytest
import jwt
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from api import app
from database.config import db_connection
from database.operations import create_user, create_user_session


# Test database name
TEST_DB_NAME = "universe_ai_test"

# Test client
client = TestClient(app)


@pytest.fixture(scope='module', autouse=True)
def setup_test_database():
    """Setup and teardown test database"""
    # Switch to test database
    original_db = db_connection.db
    db_connection.db = db_connection.client[TEST_DB_NAME]
    
    yield
    
    # Cleanup: Drop test database after all tests
    db_connection.client.drop_database(TEST_DB_NAME)
    db_connection.db = original_db


@pytest.fixture
def test_user_auth():
    """Create a test user and return auth token"""
@pytest.fixture
def test_user_auth():
    """Create a test user and return auth token"""
    # Create user
    user_id = create_user(
        email="testapi@example.com",
        password="test_password",
        full_name="API Test User"
    )
    
    # Generate token
    import os
    secret = os.getenv('JWT_SECRET', 'dev-secret')
    payload = {
        'uid': user_id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    token = jwt.encode(payload, secret, algorithm='HS256')
    
    # Create session
    create_user_session(user_id, token)
    
    return {
        'user_id': user_id,
        'token': token,
        'headers': {'Authorization': f'Bearer {token}'}
    }


@pytest.fixture
def test_prompt_data():
    """Sample prompt data for testing"""
    return {
        'title': 'Test Prompt Title',
        'content': 'This is test content for the prompt',
        'description': 'Test description',
        'category': 'programming',
        'tags': ['test', 'api', 'python'],
        'is_public': False,
        'model_preference': 'gemini-pro',
        'temperature': 0.7
    }


class TestLibrarySavePrompt:
    """Test POST /api/library/save-prompt endpoint"""
    
    def test_db_identity(self):
        """Debug test to verify DB connection identity"""
        from database.config import db_connection as test_conn
        from api import db_connection as api_conn
        
        print(f"Test DB Name: {test_conn.db.name}")
        print(f"API DB Name: {api_conn.db.name}")
        
        assert test_conn is api_conn, "db_connection instances are different!"
        assert test_conn.db.name == TEST_DB_NAME, "Test DB name incorrect"
        assert api_conn.db.name == TEST_DB_NAME, "API DB name incorrect"

    def test_save_prompt_success(self, test_user_auth, test_prompt_data):
        """Test successfully saving a prompt"""
        # DEBUG: Verify session
        from database.config import db_connection
        session = db_connection.db.user_sessions.find_one({'session_token': test_user_auth['token']})
        assert session is not None, "Session not found in test DB!"

        # DEBUG: Verify JWT
        from api import get_user_id, JWT_SECRET
        auth_header = test_user_auth['headers']['Authorization']
        decoded_uid = get_user_id(auth_header)
        print(f"DEBUG: Auth Header: {auth_header}")
        print(f"DEBUG: Decoded UID from api.get_user_id: {decoded_uid}")
        print(f"DEBUG: API JWT Secret: {JWT_SECRET}")
        
        response = client.post(
            '/api/library/save-prompt',
            json=test_prompt_data,
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 201, f"Response: {response.text}"
        data = response.json()
        with open("debug_response.txt", "w") as f:
            f.write(f"Response Data: {data}\n")
        print(f"DEBUG: Response Data: {data}")
        assert isinstance(data, dict), f"Response is not a dict: {type(data)}"
        assert 'id' in data, f"No 'id' in response: {data}"
        
    def test_save_prompt_no_auth(self, test_prompt_data):
        """Test saving prompt without authentication"""
        response = client.post(
            '/api/library/save-prompt',
            json=test_prompt_data
        )
        
        assert response.status_code == 401
        
    def test_save_prompt_invalid_token(self, test_prompt_data):
        """Test saving prompt with invalid token"""
        response = client.post(
            '/api/library/save-prompt',
            json=test_prompt_data,
            headers={'Authorization': 'Bearer invalid_token'}
        )
        
        assert response.status_code == 401
        
    def test_save_prompt_minimal_data(self, test_user_auth):
        """Test saving prompt with minimal required fields"""
        minimal_data = {
            'title': 'Minimal Prompt',
            'content': 'Minimal content'
        }
        
        response = client.post(
            '/api/library/save-prompt',
            json=minimal_data,
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 201
        
    def test_save_prompt_missing_required_fields(self, test_user_auth):
        """Test validation error when required fields are missing"""
        invalid_data = {
            'description': 'No title or content'
        }
        
        response = client.post(
            '/api/library/save-prompt',
            json=invalid_data,
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 422  # Validation error


class TestLibraryGetPrompts:
    """Test GET /api/library/prompts endpoint"""
    
    def test_get_prompts_success(self, test_user_auth, test_prompt_data):
        """Test successfully retrieving prompts"""
        # Create a prompt first
        client.post(
            '/api/library/save-prompt',
            json=test_prompt_data,
            headers=test_user_auth['headers']
        )
        
        # Get prompts
        response = client.get(
            '/api/library/prompts',
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'prompts' in data
        assert isinstance(data['prompts'], list)
        assert len(data['prompts']) > 0
        
    def test_get_prompts_filter_by_category(self, test_user_auth):
        """Test filtering prompts by category"""
        # Create prompts in different categories
        client.post(
            '/api/library/save-prompt',
            json={'title': 'Code', 'content': 'test', 'category': 'programming'},
            headers=test_user_auth['headers']
        )
        client.post(
            '/api/library/save-prompt',
            json={'title': 'Math', 'content': 'test', 'category': 'math'},
            headers=test_user_auth['headers']
        )
        
        # Filter by programming
        response = client.get(
            '/api/library/prompts?category=programming',
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 200
        data = response.json()
        prompts = data['prompts']
        assert all(p['category'] == 'programming' for p in prompts)
        
    def test_get_prompts_filter_by_tag(self, test_user_auth):
        """Test filtering prompts by tag"""
        # Create prompt with specific tag
        client.post(
            '/api/library/save-prompt',
            json={'title': 'Python', 'content': 'test', 'tags': ['python', 'code']},
            headers=test_user_auth['headers']
        )
        
        # Filter by tag
        response = client.get(
            '/api/library/prompts?tag=python',
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 200
        data = response.json()
        prompts = data['prompts']
        assert any('python' in p.get('tags', []) for p in prompts)
        
    def test_get_prompts_search(self, test_user_auth):
        """Test searching prompts"""
        # Create searchable prompt
        client.post(
            '/api/library/save-prompt',
            json={'title': 'Machine Learning Guide', 'content': 'ML content'},
            headers=test_user_auth['headers']
        )
        
        # Search
        response = client.get(
            '/api/library/prompts?search=machine',
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data['prompts']) > 0
        
    def test_get_prompts_pagination(self, test_user_auth):
        """Test pagination"""
        # Create multiple prompts
        for i in range(10):
            client.post(
                '/api/library/save-prompt',
                json={'title': f'Prompt {i}', 'content': f'Content {i}'},
                headers=test_user_auth['headers']
            )
        
        # Get first page
        response = client.get(
            '/api/library/prompts?limit=5&skip=0',
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data['prompts']) == 5
        
    def test_get_prompts_no_auth(self):
        """Test getting prompts without authentication"""
        response = client.get('/api/library/prompts')
        
        assert response.status_code == 200
        data = response.json()
        assert data['prompts'] == []  # Empty for unauthenticated


class TestLibraryUpdatePrompt:
    """Test PUT /api/library/prompts/:id endpoint"""
    
    def test_update_prompt_success(self, test_user_auth):
        """Test successfully updating a prompt"""
        # Create prompt
        create_response = client.post(
            '/api/library/save-prompt',
            json={'title': 'Original', 'content': 'content'},
            headers=test_user_auth['headers']
        )
        prompt_id = create_response.json()['id']
        
        # Update prompt
        update_response = client.put(
            f'/api/library/prompts/{prompt_id}',
            json={'title': 'Updated Title', 'is_favorite': True},
            headers=test_user_auth['headers']
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data['success'] is True
        
    def test_update_prompt_no_auth(self):
        """Test updating prompt without authentication"""
        response = client.put(
            '/api/library/prompts/fake_id',
            json={'title': 'Hacked'}
        )
        
        assert response.status_code == 401
        
    def test_update_nonexistent_prompt(self, test_user_auth):
        """Test updating a prompt that doesn't exist"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        response = client.put(
            f'/api/library/prompts/{fake_id}',
            json={'title': 'Updated'},
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 404
        
    def test_update_other_users_prompt(self):
        """Test that users cannot update other users' prompts"""
        # Create first user and prompt
        user1_id = create_user("user1@test.com", "password1", "User 1")
        
        # Generate token 1
        import os
        secret = os.getenv('JWT_SECRET', 'dev-secret')
        payload1 = {'uid': user1_id, 'exp': datetime.utcnow() + timedelta(days=1)}
        token1 = jwt.encode(payload1, secret, algorithm='HS256')
        create_user_session(user1_id, token1)
        
        create_response = client.post(
            '/api/library/save-prompt',
            json={'title': 'User1 Prompt', 'content': 'content'},
            headers={'Authorization': f'Bearer {token1}'}
        )
        prompt_id = create_response.json()['id']
        
        # Create second user
        user2_id = create_user("user2@test.com", "password2", "User 2")
        
        # Generate token 2
        payload2 = {'uid': user2_id, 'exp': datetime.utcnow() + timedelta(days=1)}
        token2 = jwt.encode(payload2, secret, algorithm='HS256')
        create_user_session(user2_id, token2)
        
        # Try to update as user2
        response = client.put(
            f'/api/library/prompts/{prompt_id}',
            json={'title': 'Hacked'},
            headers={'Authorization': f'Bearer {token2}'}
        )
        
        assert response.status_code == 404  # Not found (ownership check)


class TestLibraryDeletePrompt:
    """Test DELETE /api/library/prompts/:id endpoint"""
    
    def test_delete_prompt_success(self, test_user_auth):
        """Test successfully deleting a prompt"""
        # Create prompt
        create_response = client.post(
            '/api/library/save-prompt',
            json={'title': 'To Delete', 'content': 'content'},
            headers=test_user_auth['headers']
        )
        prompt_id = create_response.json()['id']
        
        # Delete prompt
        delete_response = client.delete(
            f'/api/library/prompts/{prompt_id}',
            headers=test_user_auth['headers']
        )
        
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data['success'] is True
        
    def test_delete_prompt_no_auth(self):
        """Test deleting prompt without authentication"""
        response = client.delete('/api/library/prompts/fake_id')
        assert response.status_code == 401
        
    def test_delete_nonexistent_prompt(self, test_user_auth):
        """Test deleting a prompt that doesn't exist"""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        response = client.delete(
            f'/api/library/prompts/{fake_id}',
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 404


class TestLibraryIncrementView:
    """Test POST /api/library/prompts/:id/view endpoint"""
    
    def test_increment_view_success(self, test_user_auth):
        """Test successfully incrementing view count"""
        # Create prompt
        create_response = client.post(
            '/api/library/save-prompt',
            json={'title': 'Viewed Prompt', 'content': 'content'},
            headers=test_user_auth['headers']
        )
        prompt_id = create_response.json()['id']
        
        # Increment view
        response = client.post(
            f'/api/library/prompts/{prompt_id}/view',
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True


class TestUserPreferencesAPI:
    """Test User Preferences API endpoints"""
    
    def test_get_preferences_success(self, test_user_auth):
        """Test getting user preferences"""
        response = client.get(
            '/api/user/preferences',
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'theme' in data
        assert 'model' in data
        
    def test_get_preferences_no_auth(self):
        """Test getting preferences without authentication"""
        response = client.get('/api/user/preferences')
        assert response.status_code == 401
        
    def test_update_preferences_success(self, test_user_auth):
        """Test updating user preferences"""
        response = client.put(
            '/api/user/preferences',
            json={
                'theme': {'mode': 'purple-black'},
                'model': {'default_model': 'gpt-4'}
            },
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        
        # Verify update
        get_response = client.get(
            '/api/user/preferences',
            headers=test_user_auth['headers']
        )
        prefs = get_response.json()
        assert prefs['theme']['mode'] == 'purple-black'
        assert prefs['model']['default_model'] == 'gpt-4'
        
    def test_save_api_key_success(self, test_user_auth):
        """Test saving encrypted API key"""
        response = client.post(
            '/api/user/preferences/api-key',
            json={
                'key_name': 'openrouter',
                'key_value': 'dummy-test-key-value'
            },
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data['success'] is True
        
    def test_get_api_key_success(self, test_user_auth):
        """Test retrieving API key"""
        # Save key first
        client.post(
            '/api/user/preferences/api-key',
            json={
                'key_name': 'gemini',
                'key_value': 'test_key_value'
            },
            headers=test_user_auth['headers']
        )
        
        # Retrieve key
        response = client.get(
            '/api/user/preferences/api-key/gemini',
            headers=test_user_auth['headers']
        )
        
        assert response.status_code == 200
        data = response.json()
        assert 'key_value' in data
        assert data['key_value'] == 'test_key_value'


class TestAuthValidationErrors:
    """Test authentication and validation error scenarios"""
    
    def test_expired_token(self):
        """Test with expired JWT token"""
        # Create expired token
        import os
        secret = os.getenv('JWT_SECRET', 'test_secret')
        payload = {
            'user_id': 'fake_id',
            'exp': datetime.utcnow() - timedelta(days=1)  # Expired
        }
        expired_token = jwt.encode(payload, secret, algorithm='HS256')
        
        response = client.get(
            '/api/library/prompts',
            headers={'Authorization': f'Bearer {expired_token}'}
        )
        
        # Should handle gracefully
        assert response.status_code in [401, 200]  # Either reject or return empty
        
    def test_malformed_authorization_header(self):
        """Test with malformed Authorization header"""
        response = client.get(
            '/api/library/prompts',
            headers={'Authorization': 'NotBearer token'}
        )
        
        assert response.status_code in [401, 200]
        
    def test_missing_bearer_prefix(self):
        """Test with missing Bearer prefix"""
        response = client.get(
            '/api/library/prompts',
            headers={'Authorization': 'just_a_token'}
        )
        
        assert response.status_code in [401, 200]


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
