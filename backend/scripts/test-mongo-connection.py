#!/usr/bin/env python3
"""测试当前 MONGODB_URI 是否可连（先启动 SSH 隧道时可用于验证）。"""
import os
import sys

# 从项目根或 backend_new 加载 .env
try:
    from pathlib import Path
    for p in [Path(__file__).resolve().parent.parent.parent / ".env",
              Path(__file__).resolve().parent.parent / ".env"]:
        if p.exists():
            from dotenv import load_dotenv
            load_dotenv(p)
            break
except ImportError:
    pass

uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/words-learning")
print(f"Testing: {uri.split('@')[-1] if '@' in uri else uri}")

try:
    from pymongo import MongoClient
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    dbs = client.list_database_names()
    print("OK: MongoDB connection successful.")
    if "words-learning" in dbs:
        print("  Database 'words-learning' exists.")
    else:
        print("  Database 'words-learning' will be created on first write.")
except Exception as e:
    print("FAIL:", e)
    sys.exit(1)
