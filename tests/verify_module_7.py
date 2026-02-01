import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def print_result(name, response):
    status = "✅" if response.status_code in [200, 201] else "❌"
    print(f"{status} {name}: {response.status_code}")
    if response.status_code not in [200, 201]:
        print(f"   Response: {response.text}")

def main():
    print("Testing Module 7 Endpoints...")
    print("=" * 50)

    # 1. Register/Login Test User
    email = "test_module7@example.com"
    password = "password123"
    
    # Try login first
    print(f"\n1. Authenticating as {email}...")
    auth_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    
    if auth_resp.status_code != 200:
        # Try registering if login fails
        print("   Login failed, registering new user...")
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Test User"
        })
        if reg_resp.status_code != 200:
            print(f"❌ Registration failed: {reg_resp.text}")
            return
        
        # Login again
        auth_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
    
    token = auth_resp.json().get("token")
    if not token:
        print("❌ Failed to get token")
        return
    
    print("✅ Authenticated successfully")
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test User Preferences (Module 7B)
    print("\n2. Testing User Preferences...")
    
    # Update preferences
    print("   Updating preferences...")
    prefs_data = {
        "theme": {"mode": "dark", "primary_color": "#8b5cf6"},
        "ui": {"enable_animations": False}
    }
    update_resp = requests.put(f"{BASE_URL}/api/user/preferences", json=prefs_data, headers=headers)
    print_result("Update Preferences", update_resp)
    
    # Get preferences
    print("   Fetching preferences...")
    get_resp = requests.get(f"{BASE_URL}/api/user/preferences", headers=headers)
    print_result("Get Preferences", get_resp)
    if get_resp.status_code == 200:
        data = get_resp.json()
        print(f"   Theme Mode: {data.get('theme', {}).get('mode')}")

    # 3. Test Library (Module 7A)
    print("\n3. Testing Library...")
    
    # Save prompt
    print("   Saving prompt...")
    prompt_data = {
        "title": "Module 7 Test Prompt",
        "content": "Testing the API integration",
        "category": "testing",
        "tags": ["api", "test"]
    }
    save_resp = requests.post(f"{BASE_URL}/api/library/save-prompt", json=prompt_data, headers=headers)
    print_result("Save Prompt", save_resp)
    
    prompt_id = None
    if save_resp.status_code == 201:
        prompt_id = save_resp.json().get("id")
        print(f"   Saved Prompt ID: {prompt_id}")

    # Get prompts
    print("   Listing prompts...")
    list_resp = requests.get(f"{BASE_URL}/api/library/prompts", headers=headers)
    print_result("List Prompts", list_resp)
    
    # View prompt (analytics)
    if prompt_id:
        print("   Tracking view...")
        view_resp = requests.post(f"{BASE_URL}/api/library/prompts/{prompt_id}/view", headers=headers)
        print_result("Track View", view_resp)

    # 4. Test API Key Storage (Encrypted)
    print("\n4. Testing API Key Storage...")
    key_data = {
        "key_name": "test_api_key",
        "key_value": "dummy-test-key-12345"
    }
    key_resp = requests.post(f"{BASE_URL}/api/user/preferences/api-key", json=key_data, headers=headers)
    print_result("Save API Key", key_resp)
    
    # Verify masked retrieval
    if key_resp.status_code == 201:
        get_key_resp = requests.get(f"{BASE_URL}/api/user/preferences/api-key/test_api_key", headers=headers)
        print_result("Get Masked Key", get_key_resp)
        if get_key_resp.status_code == 200:
            print(f"   Masked Value: {get_key_resp.json().get('masked_value')}")

if __name__ == "__main__":
    main()
