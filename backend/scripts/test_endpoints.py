import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

# Test credentials
ADMIN_EMAIL = "admin@admin.com"
PASSWORD = "password123"

def print_result(method, endpoint, status, response):
    color = "\033[92m" if 200 <= status < 300 else "\033[91m"
    reset = "\033[0m"
    print(f"{color}[{status}] {method} {endpoint}{reset}")
    if status >= 400:
        print(f"   -> Error: {response}")

def authenticate():
    print("\n--- Authenticating ---")
    try:
        res = requests.post(f"{BASE_URL}/auth/token", data={"username": ADMIN_EMAIL, "password": PASSWORD})
        if res.status_code == 200:
            token = res.json().get("access_token")
            print_result("POST", "/auth/token", res.status_code, "Success")
            return {"Authorization": f"Bearer {token}"}
        else:
            print_result("POST", "/auth/token", res.status_code, res.text)
            return None
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
        return None

def test_endpoint(headers, method, endpoint, data=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            res = requests.get(url, headers=headers)
        elif method == "POST":
            res = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            res = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            res = requests.delete(url, headers=headers)
        
        print_result(method, endpoint, res.status_code, res.text)
        return res
    except Exception as e:
        print(f"Error testing {endpoint}: {e}")
        return None

def run_all_tests():
    headers = authenticate()
    if not headers:
        print("Cannot proceed without authentication. Exiting.")
        return

    print("\n=== STARTING ENDPOINT TESTS ===\n")
    
    # --- USERS ---
    print("\n--- Users ---")
    test_endpoint(headers, "GET", "/users/me")
    _, all_users = headers, requests.get(f"{BASE_URL}/users/", headers=headers)
    test_endpoint(headers, "GET", "/users/")
    try:
        users_list = all_users.json() if all_users.status_code == 200 else []
        first_non_admin = next((u for u in users_list if u.get("role") == "merchandiser"), None)
        if first_non_admin:
            uid = first_non_admin["id"]
            test_endpoint(headers, "PUT", f"/users/{uid}", {"phone": "+216-00-111-222"})
    except Exception as e:
        print(f"PUT /users/{{id}} skipped: {e}")
    
    # --- GMS (Stores) ---
    print("\n--- GMS (Stores) ---")
    test_endpoint(headers, "GET", "/gms/")
    test_endpoint(headers, "GET", "/gms/search?q=test")
    
    # --- ARTICLES ---
    print("\n--- Articles ---")
    test_endpoint(headers, "GET", "/articles/")
    
    # --- REPORTS ---
    print("\n--- Reports ---")
    test_endpoint(headers, "GET", "/reports/")
    
    # --- OBJECTIVES ---
    print("\n--- Objectives ---")
    test_endpoint(headers, "GET", "/objectives/")
    
    # --- TRACKING ---
    print("\n--- Tracking ---")
    test_endpoint(headers, "GET", "/tracking/live")
    
    # --- COMPLAINTS ---
    print("\n--- Complaints ---")
    test_endpoint(headers, "GET", "/complaints/")
    
    # --- LEAVE REQUESTS ---
    print("\n--- Leave Requests ---")
    test_endpoint(headers, "GET", "/leave-requests/")
    
    # --- STATS ---
    print("\n--- Stats ---")
    test_endpoint(headers, "GET", "/stats/admin")
    test_endpoint(headers, "GET", "/stats/supervisor")
    test_endpoint(headers, "GET", "/stats/kpi?time_range=today")
    test_endpoint(headers, "GET", "/stats/public")
    
    # --- EVENTS ---
    print("\n--- Events ---")
    test_endpoint(headers, "GET", "/events/")
    
    # --- DOCUMENTS ---
    print("\n--- Documents ---")
    test_endpoint(headers, "GET", "/documents/")
    
    # --- UPLOAD ---
    print("\n--- Upload ---")
    try:
        with open("dummy.jpg", "wb") as f:
            f.write(b"dummy image content")
        files = {'file': ('dummy.jpg', open('dummy.jpg', 'rb'), 'image/jpeg')}
        res = requests.post(f"{BASE_URL}/upload/", headers=headers, files=files)
        print_result("POST", "/upload/", res.status_code, res.text)
    except Exception as e:
        print(f"Failed to test /upload/: {e}")
    
    # --- HEALTH ---
    print("\n--- Health ---")
    test_endpoint(headers, "GET", "/health")

    print("\n=== TESTS COMPLETED ===")

if __name__ == "__main__":
    run_all_tests()
