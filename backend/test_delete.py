import asyncio
import httpx
import os

API_URL = "http://localhost:8000"

async def test_delete():
    # Login as admin to get token
    # Oh wait, we don't know the admin password here.
    pass

if __name__ == "__main__":
    asyncio.run(test_delete())
