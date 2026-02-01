import requests
import sys
import time

BASE_URL = "http://localhost:8000"

def main():
    print("Testing Session Management Endpoints (Debug)...")
    unique_id = int(time.time())
    email = f"session_test_{unique_id}@example.com"
    password = "password123"
    
    # Register/Login
    print(f"Auth: {email}")
    reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": password, "full_name": "Tester"
    })
    
    token = reg_resp.json().get("token")
    if not token:
        print("Auth failed")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # Validate
    print("Validating...")
    val_resp = requests.get(f"{BASE_URL}/api/auth/validate", headers=headers)
    
    print(f"Status: {val_resp.status_code}")
    print(f"Text: {val_resp.text}")
    
    try:
        data = val_resp.json()
        print(f"JSON Type: {type(data)}")
        if isinstance(data, dict):
            print(f"Valid: {data.get('valid')}")
        else:
            print("Response is not a dict!")
    except Exception as e:
        print(f"JSON Error: {e}")
        
    # Logout check
    print("Logging out...")
    requests.post(f"{BASE_URL}/api/auth/logout", headers=headers)
    
    # Re-validate
    val_resp_2 = requests.get(f"{BASE_URL}/api/auth/validate", headers=headers)
    print(f"Post-Logout Status: {val_resp_2.status_code}")

if __name__ == "__main__":
    main()
