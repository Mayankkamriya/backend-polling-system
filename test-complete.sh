#!/bin/bash

echo "🧪 Real-time Polling API Comprehensive Test"
echo "=========================================="

# Start server in background
echo "🚀 Starting server..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to initialize..."
sleep 8

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ Server started successfully"

# Run tests
echo -e "\n1️⃣ Testing Health Endpoint"
curl -s http://localhost:3000/health | jq . || echo "Health endpoint failed"

echo -e "\n2️⃣ Testing User Registration"
REG_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Password123", "name": "Test User"}')

if echo "$REG_RESPONSE" | grep -q "accessToken"; then
    echo "✅ Registration successful"
    TOKEN=$(echo "$REG_RESPONSE" | jq -r '.tokens.accessToken')
    echo "Token: ${TOKEN:0:20}..."
else
    # Try login if user exists
    echo "🔄 Trying login..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"email": "test@example.com", "password": "Password123"}')
    
    if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
        echo "✅ Login successful"
        TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken')
        echo "Token: ${TOKEN:0:20}..."
    else
        echo "❌ Authentication failed"
        echo "Response: $LOGIN_RESPONSE"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
fi

echo -e "\n3️⃣ Testing Poll Creation"
POLL_RESPONSE=$(curl -s -X POST http://localhost:3000/api/polls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"question": "What is your favorite programming language?", "options": [{"text": "JavaScript"}, {"text": "Python"}, {"text": "TypeScript"}, {"text": "Go"}]}')

if echo "$POLL_RESPONSE" | grep -q '"id"'; then
    echo "✅ Poll creation successful"
    POLL_ID=$(echo "$POLL_RESPONSE" | jq -r '.poll.id')
    OPTION_ID=$(echo "$POLL_RESPONSE" | jq -r '.poll.options[1].id')
    echo "Poll ID: $POLL_ID"
    echo "Python Option ID: $OPTION_ID"
else
    echo "❌ Poll creation failed"
    echo "Response: $POLL_RESPONSE"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo -e "\n4️⃣ Testing Poll Publishing"
PUBLISH_RESPONSE=$(curl -s -X PUT http://localhost:3000/api/polls/$POLL_ID/publish \
  -H "Authorization: Bearer $TOKEN")

if echo "$PUBLISH_RESPONSE" | grep -q "published successfully"; then
    echo "✅ Poll publishing successful"
else
    echo "❌ Poll publishing failed"
    echo "Response: $PUBLISH_RESPONSE"
fi

echo -e "\n5️⃣ Testing Vote Submission"
VOTE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/polls/$POLL_ID/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"pollOptionId\": \"$OPTION_ID\"}")

if echo "$VOTE_RESPONSE" | grep -q "successfully"; then
    echo "✅ Vote submission successful"
    echo "Response: $VOTE_RESPONSE"
else
    echo "❌ Vote submission failed"
    echo "Response: $VOTE_RESPONSE"
fi

echo -e "\n6️⃣ Testing Poll Results"
RESULTS_RESPONSE=$(curl -s http://localhost:3000/api/polls/$POLL_ID)

if echo "$RESULTS_RESPONSE" | grep -q '"question"'; then
    echo "✅ Poll results retrieval successful"
    echo "$RESULTS_RESPONSE" | jq '.poll.options[] | {text: .text, votes: ._count.votes}'
else
    echo "❌ Poll results failed"
    echo "Response: $RESULTS_RESPONSE"
fi

echo -e "\n7️⃣ Testing Get All Polls"
ALL_POLLS_RESPONSE=$(curl -s http://localhost:3000/api/polls)

if echo "$ALL_POLLS_RESPONSE" | grep -q '"polls"'; then
    echo "✅ Get all polls successful"
    POLL_COUNT=$(echo "$ALL_POLLS_RESPONSE" | jq '.polls | length')
    echo "Found $POLL_COUNT published polls (including seeded data)"
    echo "Our poll found: $(echo "$ALL_POLLS_RESPONSE" | jq --arg poll_id "$POLL_ID" '.polls[] | select(.id == $poll_id) | .question')"
else
    echo "❌ Get all polls failed"
    echo "Response: $ALL_POLLS_RESPONSE"
fi

echo -e "\n🎉 Test Suite Complete!"
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null
echo "✅ Server stopped"
echo "=========================================="
