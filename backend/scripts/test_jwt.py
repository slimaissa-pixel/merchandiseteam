import os
import requests
from dotenv import load_dotenv
from jose import jwt

load_dotenv()
SUPABASE_URL = "https://iqtvcmaesgrckywpfbwu.supabase.co"
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
