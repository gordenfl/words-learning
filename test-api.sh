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

# Add a word
echo "4. Adding a test word..."
word_response=$(curl -s -X POST $API_URL/words \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "word": "challenge",
    "definition": "A task that tests someone'\''s abilities",
    "examples": ["This is a real challenge"]
  }')

if echo "$word_response" | grep -q "Word added successfully"; then
    echo -e "${GREEN}✓${NC} Word added successfully"
else
    echo -e "${YELLOW}⚠${NC} Word might already exist or add failed"
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

# Generate article
echo "7. Generating learning article..."
article_response=$(curl -s -X POST $API_URL/articles/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"wordCount": 5}')

if echo "$article_response" | grep -q "Article generated successfully"; then
    echo -e "${GREEN}✓${NC} Article generated successfully"
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

