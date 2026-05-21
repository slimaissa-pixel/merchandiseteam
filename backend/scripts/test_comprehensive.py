import requests
import json

BASE_URL = "http://localhost:8000/api"

def print_step(title):
    print(f"\n{'-'*50}\n> {title}\n{'-'*50}")

def print_result(method, endpoint, status, response_json):
    color = "\033[92m" if 200 <= status < 300 else "\033[91m"
    reset = "\033[0m"
    print(f"{color}[{status}] {method} {endpoint}{reset}")
    if response_json:
        # Print formatted JSON so we can "see the responses !!"
        print(json.dumps(response_json, indent=2))
    else:
        print(" (No JSON Response)")

def api_call(headers, method, endpoint, data=None, files=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            res = requests.get(url, headers=headers)
        elif method == "POST":
            res = requests.post(url, headers=headers, json=data, files=files)
        elif method == "PUT":
            res = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            res = requests.delete(url, headers=headers)
        
        try:
            res_json = res.json()
        except:
            res_json = res.text if res.text else None
            
        print_result(method, endpoint, res.status_code, res_json)
        return res.status_code, res_json
    except Exception as e:
        print(f"Error calling {endpoint}: {e}")
        return 500, None

def authenticate(email, password):
    print(f"\n🔑 Authenticating as: {email}")
    res = requests.post(f"{BASE_URL}/auth/token", data={"username": email, "password": password})
    if res.status_code == 200:
        token = res.json().get("access_token")
        print_result("POST", "/auth/token", res.status_code, {"token": "***hidden***"})
        return {"Authorization": f"Bearer {token}"}
    else:
        print_result("POST", "/auth/token", res.status_code, res.text)
        return None

def run_tests():
    # ---------------------------------------------------------
    # 1. ADMIN ACTIONS (CRUD users, gms, articles, notifications)
    # ---------------------------------------------------------
    print_step("ADMIN ACTIONS (CRUD)")
    admin_headers = authenticate("admin@admin.com", "password123")
    if not admin_headers:
        print("Failed to login as admin, cannot continue.")
        return

    # CREATE GMS
    _, gms_res = api_call(admin_headers, "POST", "/gms/", {
        "name": "TEST MEGA STORE",
        "address": "123 Main St",
        "latitude": 36.8,
        "longitude": 10.1,
        "city": "Tunis",
        "type": "supermarket"
    })
    gms_id = gms_res.get("id") if isinstance(gms_res, dict) else None

    # UPDATE GMS
    if gms_id:
        api_call(admin_headers, "PUT", f"/gms/{gms_id}/", {
            "name": "TEST MEGA STORE (UPDATED)"
        })
        # Read GMS (Near)
        api_call(admin_headers, "GET", "/gms/nearest/?latitude=36.8&longitude=10.1&limit=2")

    # CREATE ARTICLE
    _, art_res = api_call(admin_headers, "POST", "/articles/", {
        "name": "Test Energy Drink",
        "category": "Beverages",
        "price": 2.50,
        "gms_id": gms_id
    })
    art_id = art_res.get("id") if isinstance(art_res, dict) else None

    # UPDATE ARTICLE
    if art_id:
        api_call(admin_headers, "PUT", f"/articles/{art_id}", {
            "price": 3.00
        })

    # CREATE MERCHANDISER USER
    test_merch_email = "test_merch99@test.com"
    api_call(admin_headers, "POST", "/users/", {
        "email": test_merch_email,
        "password": "password123",
        "first_name": "Test",
        "last_name": "Merch",
        "role": "merchandiser",
        "is_active": True
    })

    # GET ALL USERS
    _, users_res = api_call(admin_headers, "GET", "/users/?limit=5")
    
    # ASSIGN MERCHANDISER TO THE STORE
    merch_id = next((u["id"] for u in (users_res if isinstance(users_res, list) else []) if u["email"] == test_merch_email), None)

    # UPDATE USER (Critical bug fix: was_inactive/is_demo NameError)
    if merch_id:
        api_call(admin_headers, "PUT", f"/users/{merch_id}", {
            "phone": "+216-00-000-000",
            "is_active": True
        })
    if merch_id and gms_id:
        api_call(admin_headers, "POST", "/gms/assign", {
            "user_id": merch_id,
            "gms_id": gms_id,
            "visit_order": 1
        })

    # CREATE NOTIFICATION
    if merch_id:
        api_call(admin_headers, "POST", "/notifications/", {
            "user_id": merch_id,
            "title": "Welcome",
            "message": "Welcome to the test",
            "type": "info"
        })

    # GET EVENTS & REPORTS & LEAVE REQUESTS
    api_call(admin_headers, "GET", "/events/")
    api_call(admin_headers, "GET", "/reports/")
    api_call(admin_headers, "GET", "/leave-requests/")


    # ---------------------------------------------------------
    # 2. MERCHANDISER ACTIONS (Sessions, tracking, visits)
    # ---------------------------------------------------------
    print_step("MERCHANDISER ACTIONS (Tracking, Sessions)")
    merch_headers = authenticate(test_merch_email, "password123")
    if not merch_headers:
        # Fallback to demo merch if the created one failed
        merch_headers = authenticate("merch@merch.com", "password123")

    if merch_headers:
        # Check active session
        api_call(merch_headers, "GET", "/tracking/active-session")
        
        # Test Image Upload
        with open("dummy.jpg", "wb") as f:
            f.write(b"dummy image content")
        files = {'file': ('dummy.jpg', open('dummy.jpg', 'rb'), 'image/jpeg')}
        api_call(merch_headers, "POST", "/upload/", files=files)
        
        # Start Workday
        _, wd_res = api_call(merch_headers, "POST", "/tracking/workday/start", {
            "start_lat": 36.8,
            "start_lng": 10.1
        })
        wd_id = wd_res.get("id") if isinstance(wd_res, dict) else None

        # Start Visit
        visit_id = None
        if wd_id and gms_id:
            _, visit_res = api_call(merch_headers, "POST", "/tracking/visit/start", {
                "workday_id": wd_id,
                "gms_id": gms_id,
                "start_lat": 36.8,
                "start_lng": 10.1
            })
            visit_id = visit_res.get("id") if isinstance(visit_res, dict) else None

        # Sync GPS Logs
        if wd_id:
            api_call(merch_headers, "POST", "/tracking/logs/sync", [
                {"workday_id": wd_id, "latitude": 36.8, "longitude": 10.1, "log_type": "gps"}
            ])
            # Heartbeat
            api_call(merch_headers, "POST", "/tracking/heartbeat", {
                "latitude": 36.8,
                "longitude": 10.1
            })

        # End Visit
        if visit_id:
            api_call(merch_headers, "POST", "/tracking/visit/end", {
                "visit_id": visit_id,
                "data": {
                    "end_lat": 36.8,
                    "end_lng": 10.1
                }
            })

        # End Workday
        if wd_id:
            api_call(merch_headers, "POST", "/tracking/workday/end", {
                "end_lat": 36.8,
                "end_lng": 10.1
            })


    # ---------------------------------------------------------
    # 3. SUPERVISOR ACTIONS (Team Live, Reports)
    # ---------------------------------------------------------
    print_step("SUPERVISOR ACTIONS (Team Tracking)")
    # Since admin can also see Team Live, let's just use admin_headers to save time creating a supervisor
    api_call(admin_headers, "GET", "/tracking/team/live")
    if merch_id:
        api_call(admin_headers, "GET", f"/tracking/history/{merch_id}")


    # ---------------------------------------------------------
    # 4. CLEANUP
    # ---------------------------------------------------------
    print_step("CLEANUP (DELETE GMS, Article, User)")
    if art_id:
        api_call(admin_headers, "DELETE", f"/articles/{art_id}")
    if gms_id:
        api_call(admin_headers, "DELETE", f"/gms/{gms_id}/")
    if merch_id:
        api_call(admin_headers, "DELETE", f"/users/{merch_id}")

    print("\n\n=== COMPREHENSIVE TESTING COMPLETED ===")

if __name__ == "__main__":
    run_tests()
