import requests
import json

url = "http://localhost:8000/api/chat/completions"
payload = {
    "model": "test",
    "messages": [{"role": "user", "content": "hello"}],
    "temperature": 0.7,
    "max_tokens": 100
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
