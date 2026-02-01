import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def main():
    print("Testing Module 7 Endpoints (Fixed)...")
    email = "test_module7@example.com"
    password = "password123"
    
    print(f"\n1. Authenticating as {email}...")
    auth_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    
    # Check if login failed (either non-200 OR explicit error response)
    if auth_resp.status_code != 200 or "error" in auth_resp.json():
        print("   Login failed (user likely doesn't exist), registering...")
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Test User"
        })
        print(f"   Registration Response: {reg_resp.text}")
        
        if reg_resp.status_code != 200 or "error" in reg_resp.json():
            print("❌ Registration failed.")
            return

        # Login again
        auth_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
    
    token = auth_resp.json().get("token")
    if not token:
        print(f"❌ Failed to get token. Response: {auth_resp.text}")
        return
    
    print("✅ Authenticated successfully")
    headers = {"Authorization": f"Bearer {token}"}
    
    # NOW PROCEED WITH MODULE 7 TESTS
    
    # 2. Test User Preferences (Module 7B)
    print("\n2. Testing User Preferences...")
    update_resp = requests.put(f"{BASE_URL}/api/user/preferences", json={
        "theme": {"mode": "dark"}
    }, headers=headers)
    print(f"   Update Prefs: {update_resp.status_code}")
    
    get_resp = requests.get(f"{BASE_URL}/api/user/preferences", headers=headers)
    print(f"   Get Prefs: {get_resp.json().get('theme')}")

    # 3. Test Library (Module 7A)
    print("\n3. Testing Library...")
    save_resp = requests.post(f"{BASE_URL}/api/library/save-prompt", json={
        "title": "API Test",
        "content": "Content",
        "category": "test"
    }, headers=headers)
    print(f"   Save Prompt: {save_resp.status_code}")
    
    prompt_id = save_resp.json().get("id")
    if prompt_id:
        print(f"   Saved ID: {prompt_id}")
        
    list_resp = requests.get(f"{BASE_URL}/api/library/prompts", headers=headers)
    print(f"   List Prompts: Found {len(list_resp.json().get('prompts', []))}")

    # 4. API Key
    print("\n4. Testing API Key...")
    key_resp = requests.post(f"{BASE_URL}/api/user/preferences/api-key", json={
        "key_name": "test_key", 
        "key_value": "secret"
    }, headers=headers)
    print(f"   Save Key: {key_resp.status_code}")
    
    get_key_resp = requests.get(f"{BASE_URL}/api/user/preferences/api-key/test_key", headers=headers)
    print(f"   Get Key: {get_key_resp.json()}")

if __name__ == "__main__":
    main()
