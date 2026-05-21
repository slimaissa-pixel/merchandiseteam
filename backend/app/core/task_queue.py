import os
from redis import Redis
from rq import Queue

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")

sync_redis = Redis.from_url(redis_url)

email_queue = Queue("email_tasks", connection=sync_redis)
report_queue = Queue("report_tasks", connection=sync_redis)
