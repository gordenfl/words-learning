#!/usr/bin/env python3
"""
Migrate word status from unknown/known to new/learned.
Run once after deploying the New/Learned status change.

Usage:
  cd backend_new && python scripts/migrate-word-status.py
"""
import os
import sys

# Load .env
try:
    from pathlib import Path
    for p in [
        Path(__file__).resolve().parent.parent.parent / ".env",
        Path(__file__).resolve().parent.parent / ".env",
    ]:
        if p.exists():
            from dotenv import load_dotenv
            load_dotenv(p)
            break
except ImportError:
    pass

uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/words-learning")
db_name = os.environ.get("MONGODB_DB_NAME", "words-learning")

# Parse db name from URI if present
if "/" in uri.split("/")[-1] and "?" not in uri.split("/")[-1]:
    db_name = uri.split("/")[-1].split("?")[0] or db_name

print(f"Connecting to MongoDB: {uri.split('@')[-1] if '@' in uri else uri}")
print(f"Database: {db_name}")

try:
    from pymongo import MongoClient
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client[db_name]
    coll = db["words"]
except Exception as e:
    print("FAIL:", e)
    sys.exit(1)

# Migrate unknown -> new
r1 = coll.update_many({"status": "unknown"}, {"$set": {"status": "new"}})
print(f"Updated unknown -> new: {r1.modified_count} documents")

# Migrate known -> learned
r2 = coll.update_many({"status": "known"}, {"$set": {"status": "learned"}})
print(f"Updated known -> learned: {r2.modified_count} documents")

total = r1.modified_count + r2.modified_count
print(f"Done. Total migrated: {total}")
