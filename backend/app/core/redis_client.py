import os
import redis.asyncio as aioredis
from typing import Optional

class RedisManager:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.url = os.environ.get("REDIS_URL", "redis://localhost:6379")

    async def connect(self):
        if not self.redis:
            self.redis = await aioredis.from_url(self.url, encoding="utf-8", decode_responses=True)

    async def disconnect(self):
        if self.redis:
            await self.redis.close()
            self.redis = None

    async def get_client(self) -> aioredis.Redis:
        if not self.redis:
            await self.connect()
        return self.redis

redis_manager = RedisManager()

async def get_redis():
    client = await redis_manager.get_client()
    return client
