import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

supabase_client: Client | None = None

def get_supabase() -> Client | None:
    global supabase_client
    if supabase_client is not None:
        return supabase_client
        
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        logger.warning("SUPABASE_URL or SUPABASE_ANON_KEY not provided. Supabase integration is disabled.")
        return None
        
    try:
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        return supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None
