"""Patch the Redis publish block in tracking.py to be resilient when Redis is unavailable."""
path = r"backend/app/api/v1/endpoints/tracking.py"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Locate and replace just the dangerous await redis.publish call
old = "        redis = await get_redis()\n        await redis.publish(\"live_location:all\", json.dumps(message))\n        \n        # In a full system, you would identify specific supervisor channels and publish there too\n        if current_user.supervisor_id:\n             await redis.publish(f\"live_location:{current_user.supervisor_id}\", json.dumps(message))\n    except Exception as e:\n        # Ignore redis errors so GPS sync doesn't fail\n        print(f\"Warning: Failed to publish live location to Redis: {e}\")"

new = "        redis = await get_redis()\n        if redis:\n            await redis.publish(\"live_location:all\", json.dumps(message))\n            # Publish to supervisor channel if assigned\n            if current_user.supervisor_id:\n                await redis.publish(f\"live_location:{current_user.supervisor_id}\", json.dumps(message))\n    except Exception as e:\n        # Redis is optional -- GPS sync must NEVER fail because of it\n        print(f\"[Redis] Warning: Failed to publish live location: {e}\")"

# Handle Windows line endings too
old_win = old.replace("\n", "\r\n")
new_win = new.replace("\n", "\r\n")

if old in content:
    content = content.replace(old, new)
    print("Patched (LF)")
elif old_win in content:
    content = content.replace(old_win, new_win)
    print("Patched (CRLF)")
else:
    print("ERROR: Target block not found!")
    import sys
    sys.exit(1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done - tracking.py patched successfully.")
