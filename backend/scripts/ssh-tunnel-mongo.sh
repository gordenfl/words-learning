#!/bin/bash
# 在本地开 SSH 隧道，把本机 27017 转发到服务器上的 MongoDB，便于本地 backend_new 连接
# 使用：./scripts/ssh-tunnel-mongo.sh
# 保持此终端不关；另开终端运行 python manage.py runserver 8088

HOST="${SSH_MONGO_HOST:-gordenfl.com}"
PORT="${SSH_MONGO_PORT:-22}"
KEY="${SSH_KEY:-$HOME/.ssh/gordongmai.com.pem}"
LOCAL_PORT=27017
REMOTE_PORT=27017

echo "Opening tunnel: localhost:$LOCAL_PORT -> $HOST:$REMOTE_PORT (via SSH)"
echo "Keep this terminal open. In another terminal run: python manage.py runserver 8088"
echo ""

if [ -n "$KEY" ] && [ -f "$KEY" ]; then
  exec ssh -N -L "$LOCAL_PORT:localhost:$REMOTE_PORT" -p "$PORT" -i "$KEY" "ec2-user@$HOST"
else
  exec ssh -N -L "$LOCAL_PORT:localhost:$REMOTE_PORT" -p "$PORT" "ec2-user@$HOST"
fi
