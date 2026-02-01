import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def main():
    print("Testing Module 7 Endpoints (Debug Mode)...")
    email = "test_module7@example.com"
    password = "password123"
    
    print(f"\n1. Authenticating as {email}...")
    try:
        auth_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        print(f"Initial Login Status: {auth_resp.status_code}")
        print(f"Initial Login Response: {auth_resp.text}")
        
        if auth_resp.status_code != 200:
            print("   Login failed, registering new user...")
            reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": email,
                "password": password,
                "full_name": "Test User"
            })
            print(f"Registration Status: {reg_resp.status_code}")
            print(f"Registration Response: {reg_resp.text}")
            
            if reg_resp.status_code != 200:
                return
            
            # Login again
            auth_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            print(f"Second Login Status: {auth_resp.status_code}")
            print(f"Second Login Response: {auth_resp.text}")
        
        token = auth_resp.json().get("token")
        if not token:
            print("❌ Failed to get token")
            return
        
        print("✅ Authenticated successfully")
        
        # Proceed with tests if successful... (omitted for brevity during debug)
        
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    main()
