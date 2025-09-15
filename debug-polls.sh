#!/bin/bash

echo "🔍 Debugging Poll Retrieval Issue"
echo "================================"

# Start server
npm run dev > server.log 2>&1 &
SERVER_PID=$!
sleep 5

echo "1️⃣ Testing Get All Polls (no filters)"
curl -s http://localhost:3000/api/polls | jq '.'

echo -e "\n2️⃣ Testing Get All Polls (published=true)"
curl -s "http://localhost:3000/api/polls?published=true" | jq '.'

echo -e "\n3️⃣ Testing Get All Polls (published=false)"  
curl -s "http://localhost:3000/api/polls?published=false" | jq '.'

echo -e "\n4️⃣ Direct Database Query via Health Check"
curl -s http://localhost:3000/health | jq '.'

# Clean up
kill $SERVER_PID 2>/dev/null
echo -e "\nServer stopped"
