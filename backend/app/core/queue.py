from redis import Redis
from rq import Queue
from app.core.config import settings

# Initialize Redis connection
try:
    redis_conn = Redis.from_url(settings.REDIS_URL if hasattr(settings, 'REDIS_URL') else "redis://localhost:6379/0")
    # Initialize default queue
    task_queue = Queue('default', connection=redis_conn)
except Exception as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to connect to Redis: {e}")
    redis_conn = None
    task_queue = None
