import requests
import sys
import time

BASE_URL = "http://localhost:8000"

def main():
    print("Testing Session Management Endpoints...")
    unique_id = int(time.time())
    email = f"session_test_{unique_id}@example.com"
    password = "password123"
    
    print(f"\n1. Registering/Authenticating as {email}...")
    
    # Register explicitly
    reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": password,
        "full_name": "Session Tester"
    })
    
    if reg_resp.status_code == 200:
        token = reg_resp.json().get("token")
        print("   Registered successfully")
    else:
        # Fallback to login
        auth_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        token = auth_resp.json().get("token")
        print("   Logged in")

    if not token:
        print("❌ Auth failed")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Validate Session
    print("\n2. Validating Session...")
    val_resp = requests.get(f"{BASE_URL}/api/auth/validate", headers=headers)
    print(f"   Status: {val_resp.status_code}")
    print(f"   Response: {val_resp.json()}")
    
    if val_resp.status_code == 200 and val_resp.json().get("valid"):
        print("✅ Session Valid")
    else:
        print("❌ Session Invalid")
        
    # 3. Logout
    print("\n3. Logging Out...")
    logout_resp = requests.post(f"{BASE_URL}/api/auth/logout", headers=headers)
    print(f"   Status: {logout_resp.status_code}")
    
    # 4. Verify Session is Invalid
    print("\n4. Verifying Session Invalidation...")
    val_resp_2 = requests.get(f"{BASE_URL}/api/auth/validate", headers=headers)
    print(f"   Status: {val_resp_2.status_code}")
    print(f"   Response: {val_resp_2.json()}")
    
    if val_resp_2.status_code == 401:
        print("✅ Session Successfully Invalidated")
    else:
        print("❌ Session Still Valid (Expected 401)")

if __name__ == "__main__":
    main()
