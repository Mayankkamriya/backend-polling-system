#!/bin/bash

echo "🧪 Real-time Polling API Test Suite"
echo "=================================="

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 3

# Test 1: Health Check
echo -e "\n1️⃣ Testing Health Endpoint"
echo "curl -s http://localhost:3000/health"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if [[ $? -eq 0 && $HEALTH_RESPONSE == *"status"* ]]; then
    echo "✅ Health check passed"
    echo "Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

# Test 2: User Registration
echo -e "\n2️⃣ Testing User Registration"
echo "curl -s -X POST http://localhost:3000/api/auth/register"
REG_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }')
if [[ $? -eq 0 && $REG_RESPONSE == *"token"* ]]; then
    echo "✅ User registration passed"
    # Extract token for later use
    TOKEN=$(echo $REG_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:20}..."
else
    echo "❌ User registration failed"
    echo "Response: $REG_RESPONSE"
    
    # Try login with existing user
    echo -e "\n🔄 Trying login instead..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "password": "password123"
      }')
    if [[ $? -eq 0 && $LOGIN_RESPONSE == *"token"* ]]; then
        echo "✅ User login passed"
        TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "Token: ${TOKEN:0:20}..."
    else
        echo "❌ User login failed"
        echo "Response: $LOGIN_RESPONSE"
        exit 1
    fi
fi

# Test 3: Create Poll
echo -e "\n3️⃣ Testing Poll Creation"
echo "curl -s -X POST http://localhost:3000/api/polls"
POLL_RESPONSE=$(curl -s -X POST http://localhost:3000/api/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "question": "Test Poll Question?",
    "options": ["Option A", "Option B", "Option C"]
  }')
if [[ $? -eq 0 && $POLL_RESPONSE == *"id"* ]]; then
    echo "✅ Poll creation passed"
    POLL_ID=$(echo $POLL_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "Poll ID: $POLL_ID"
else
    echo "❌ Poll creation failed"
    echo "Response: $POLL_RESPONSE"
    exit 1
fi

# Test 4: Get Polls
echo -e "\n4️⃣ Testing Get Polls"
echo "curl -s http://localhost:3000/api/polls"
POLLS_RESPONSE=$(curl -s http://localhost:3000/api/polls)
if [[ $? -eq 0 && $POLLS_RESPONSE == *"polls"* ]]; then
    echo "✅ Get polls passed"
    echo "Response length: $(echo $POLLS_RESPONSE | wc -c) characters"
else
    echo "❌ Get polls failed"
    echo "Response: $POLLS_RESPONSE"
fi

# Test 5: Vote on Poll
echo -e "\n5️⃣ Testing Vote Submission"
echo "curl -s -X POST http://localhost:3000/api/polls/$POLL_ID/vote"
VOTE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/polls/$POLL_ID/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "optionIndex": 0
  }')
if [[ $? -eq 0 && $VOTE_RESPONSE == *"vote"* ]]; then
    echo "✅ Vote submission passed"
    echo "Response: $VOTE_RESPONSE"
else
    echo "❌ Vote submission failed"
    echo "Response: $VOTE_RESPONSE"
fi

# Test 6: Get Poll Results
echo -e "\n6️⃣ Testing Poll Results"
echo "curl -s http://localhost:3000/api/polls/$POLL_ID"
RESULTS_RESPONSE=$(curl -s http://localhost:3000/api/polls/$POLL_ID)
if [[ $? -eq 0 && $RESULTS_RESPONSE == *"votes"* ]]; then
    echo "✅ Poll results passed"
    echo "Response: $RESULTS_RESPONSE"
else
    echo "❌ Poll results failed"
    echo "Response: $RESULTS_RESPONSE"
fi

echo -e "\n🎉 Test Suite Complete!"
echo "=================================="
