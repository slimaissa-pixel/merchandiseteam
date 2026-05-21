import requests

BASE_URL = "http://localhost:8001/api"

print("Logging in...")
res = requests.post(f"{BASE_URL}/auth/token", data={"username": "admin@admin.com", "password": "password123"})
token = res.json().get("access_token")

headers = {"Authorization": f"Bearer {token}"}
print("Creating article...")
res = requests.post(f"{BASE_URL}/articles/", headers=headers, json={
    "name": "Test Energy Drink",
    "category": "Beverages",
    "price": 2.50
})
print("Response:", res.status_code)
print(res.text)
