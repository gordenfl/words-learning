#!/bin/bash
# 把 backend_new 部署到 gordenfl.com 服务器并在 Docker 中运行
# 用法：在项目根目录 words-learning 下执行：./backend_new/scripts/deploy-to-gordenfl.sh

set -e
cd "$(dirname "$0")/../.."

SERVER_USER="${DEPLOY_USER:-ec2-user}"
SERVER_HOST="${DEPLOY_HOST:-gordenfl.com}"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/gordongmai.com.pem}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/ec2-user/CI/words-learning}"

echo "📤 部署 backend_new 到 $SERVER_USER@$SERVER_HOST:$DEPLOY_PATH"
echo ""

# 1. 同步 backend_new 和 docker-compose.yml 到服务器
echo "1. 同步代码..."
rsync -avz --delete \
  -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=accept-new" \
  backend_new/ \
  "$SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/backend_new/"

rsync -avz \
  -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=accept-new" \
  docker-compose.yml \
  "$SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/"

# 2. 若本地有 .env.production，同步到服务器 .env（可选）
if [ -f .env ]; then
  echo "2. 同步 .env ..."
  scp -i "${SSH_KEY}" -o StrictHostKeyChecking=accept-new .env "$SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/"
else
  echo "2. 跳过 .env（请确保服务器 $DEPLOY_PATH/.env 已配置 MONGODB_URI 等）"
fi

# 3. 在服务器上构建并启动 backend_new 容器
echo ""
echo "3. 在服务器上构建并启动 Docker 容器..."
ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=accept-new "$SERVER_USER@$SERVER_HOST" << ENDSSH
  set -e
  cd $DEPLOY_PATH
  docker-compose up -d --build backend_new
  echo ""
  docker-compose ps backend_new
  echo ""
  echo "✅ backend_new 已启动。查看日志: docker-compose logs -f backend_new"
ENDSSH

echo ""
echo "🎉 部署完成。Django API 地址: http://${SERVER_HOST}:8089"
echo "   健康检查: curl http://${SERVER_HOST}:8089/api/health"
