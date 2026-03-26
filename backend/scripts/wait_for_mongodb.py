#!/usr/bin/env python3
"""Wait until MONGODB_URI is reachable (container start / DNS / network attach race)."""
import os
import sys
import time

from pymongo import MongoClient

# Container env is injected by compose; no dotenv here.
uri = os.environ.get("MONGODB_URI") or "mongodb://localhost:27017/words-learning"
attempts = int(os.environ.get("MONGO_WAIT_ATTEMPTS", "45"))
sleep_s = int(os.environ.get("MONGO_WAIT_SLEEP", "2"))

for i in range(attempts):
    try:
        MongoClient(uri, serverSelectionTimeoutMS=5000).admin.command("ping")
        print("wait_for_mongodb: OK", flush=True)
        sys.exit(0)
    except Exception as e:
        print(f"wait_for_mongodb: {i + 1}/{attempts}: {e}", flush=True)
        time.sleep(sleep_s)

print("wait_for_mongodb: giving up", flush=True)
sys.exit(1)
