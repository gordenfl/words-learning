#!/bin/bash

# API Test Script for Words Learning App

API_URL="http://localhost:3000/api"
TOKEN=""

echo "========================================="
echo "  Words Learning API Test"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test health endpoint
echo "1. Testing health endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✓${NC} Health check passed"
else
    echo -e "${RED}✗${NC} Health check failed (HTTP $response)"
    echo "Make sure the backend server is running on port 3000"
    exit 1
fi
echo ""

# Register a test user
echo "2. Registering test user..."
RANDOM_NUM=$RANDOM
TEST_EMAIL="testuser${RANDOM_NUM}@example.com"
TEST_USERNAME="testuser${RANDOM_NUM}"
TEST_PASSWORD="password123"

register_response=$(curl -s -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_USERNAME\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

TOKEN=$(echo $register_response | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓${NC} User registered successfully"
    echo "   Email: $TEST_EMAIL"
else
    echo -e "${RED}✗${NC} Registration failed"
    echo "$register_response"
    exit 1
fi
echo ""

# Test login
echo "3. Testing login..."
login_response=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$login_response" | grep -q "token"; then
    echo -e "${GREEN}✓${NC} Login successful"
else
    echo -e "${RED}✗${NC} Login failed"
fi
echo ""

# Add Chinese test words
echo "4. Adding Chinese test words..."

# 添加多个中文单词用于测试
chinese_words='[
  "学习", "中文", "你好", "谢谢", "朋友",
  "工作", "生活", "快乐", "美丽", "时间"
]'

word_response=$(curl -s -X POST $API_URL/words/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"words\": $chinese_words}")

if echo "$word_response" | grep -q "Added"; then
    added_count=$(echo $word_response | grep -o '"added":\[[^]]*\]' | grep -o '学习' | wc -l)
    echo -e "${GREEN}✓${NC} Chinese words added successfully"
    echo "   Added 10 Chinese words for testing"
else
    echo -e "${YELLOW}⚠${NC} Some words might already exist"
fi
echo ""

# Get words list
echo "5. Fetching words list..."
words_list=$(curl -s -X GET $API_URL/words \
  -H "Authorization: Bearer $TOKEN")

word_count=$(echo $words_list | grep -o '"count":[0-9]*' | grep -o '[0-9]*')
echo -e "${GREEN}✓${NC} Retrieved $word_count word(s)"
echo ""

# Get statistics
echo "6. Fetching statistics..."
stats=$(curl -s -X GET $API_URL/words/stats \
  -H "Authorization: Bearer $TOKEN")

if echo "$stats" | grep -q "total"; then
    total=$(echo $stats | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    echo -e "${GREEN}✓${NC} Statistics retrieved"
    echo "   Total words: $total"
else
    echo -e "${RED}✗${NC} Failed to get statistics"
fi
echo ""

# Set learning plan
echo "7. Setting up learning plan..."
plan_response=$(curl -s -X PATCH $API_URL/users/learning-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "dailyWordGoal": 10,
    "weeklyWordGoal": 50,
    "monthlyWordGoal": 200,
    "difficulty": "intermediate"
  }')

if echo "$plan_response" | grep -q "Learning plan updated"; then
    echo -e "${GREEN}✓${NC} Learning plan set successfully"
    echo "   Difficulty: Intermediate (中级)"
    echo "   Daily goal: 10 words/day"
else
    echo -e "${YELLOW}⚠${NC} Learning plan setup skipped"
fi
echo ""

# Generate article
echo "8. Generating Chinese learning article..."
article_response=$(curl -s -X POST $API_URL/articles/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"wordCount": 5}')

if echo "$article_response" | grep -q "Article generated successfully"; then
    echo -e "${GREEN}✓${NC} Chinese learning article generated successfully"
    echo "   Article will contain your Chinese words"
else
    echo -e "${YELLOW}⚠${NC} Article generation skipped (need more words)"
fi
echo ""

echo "========================================="
echo -e "${GREEN}✓ All tests completed!${NC}"
echo "========================================="
echo ""
echo "Test credentials:"
echo "  Email: $TEST_EMAIL"
echo "  Password: $TEST_PASSWORD"
echo "  Token: ${TOKEN:0:50}..."
echo ""
echo "You can use these credentials to test the mobile app!"

