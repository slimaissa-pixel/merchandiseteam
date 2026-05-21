import requests

# We first need to get a token to upload
login_data = {
    "username": "admin@admin.com",
    "password": "password123"
}
res = requests.post("http://localhost:8002/api/auth/token", data=login_data)
token = res.json().get("access_token")

# Create a dummy image file
with open("dummy.jpg", "wb") as f:
    f.write(b"dummy image content")

files = {'file': ('dummy.jpg', open('dummy.jpg', 'rb'), 'image/jpeg')}
headers = {'Authorization': f'Bearer {token}'}

print("Uploading...")
res = requests.post("http://localhost:8002/api/upload/", files=files, headers=headers)
print("Status Code:", res.status_code)
print("Response:", res.json())
