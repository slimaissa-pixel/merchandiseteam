"""
Quick email integration test.
Run from the backend/ folder:
    python test_email.py your@email.com
"""
import asyncio
import sys
import os

# Make sure app imports resolve
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.services import mail

async def main(target: str):
    print(f"\n{'='*50}")
    print(f"  RESEND_API_KEY : {'SET [OK]' if settings.RESEND_API_KEY else 'NOT SET - simulation mode'}")
    print(f"  FROM           : {settings.DEFAULT_FROM_EMAIL}")
    print(f"  APP_URL        : {settings.APP_URL}")
    print(f"  TO             : {target}")
    print(f"{'='*50}\n")

    print("Sending APPROVAL email...")
    await mail.send_approval_email(target)
    print("Done.\n")

    print("Sending DENIAL email...")
    await mail.send_denial_email(target)
    print("Done.\n")

    print("Test complete. Check your inbox (or logs above if in simulation mode).")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_email.py aymenderbelaymen@gmail.com")
        sys.exit(1)

    asyncio.run(main(sys.argv[1]))
