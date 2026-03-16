#!/bin/bash
# 仅把 backend 目录同步到服务器（不包含 node_modules、.env）
# 用法：在项目根目录执行  ./backend/scripts/sync-backend-to-server.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

# 服务器配置（与 DEPLOY_GUIDE 一致，可用环境变量覆盖）
SERVER_USER="${DEPLOY_SERVER_USER:-ec2-user}"
SERVER_HOST="${DEPLOY_SERVER_HOST:-gordenfl.com}"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/gordongmail.com.pem}"
REMOTE_PATH="${DEPLOY_PATH:-/home/ec2-user/CI/words-learning}"

echo "📤 同步 backend -> $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/backend"
echo "   排除: node_modules, .env, *.log"
echo ""

rsync -avz --delete \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=accept-new" \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  "$BACKEND_DIR/" \
  "$SERVER_USER@$SERVER_HOST:$REMOTE_PATH/backend/"

echo ""
echo "✅ 同步完成。在服务器上可执行："
echo "   ssh -i $SSH_KEY $SERVER_USER@$SERVER_HOST"
echo "   cd $REMOTE_PATH/backend && npm install && node scripts/add-user-gordenliu.js  # 如需跑脚本"
echo "   或 cd $REMOTE_PATH && docker-compose up -d --build backend  # 若用 Docker 部署"
