#!/usr/bin/env node

const axios = require('axios');

async function testAPI() {
  const baseURL = 'http://localhost:3000';
  
  console.log('🧪 Real-time Polling API Test Suite');
  console.log('==================================');
  
  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing Health Endpoint');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check passed');
    console.log('Response:', healthResponse.data);
    
    // Test 2: User Registration
    console.log('\n2️⃣ Testing User Registration');
    let token;
    try {
      const regResponse = await axios.post(`${baseURL}/api/auth/register`, {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      console.log('✅ User registration passed');
      token = regResponse.data.token;
      console.log('Token received:', token.substring(0, 20) + '...');
    } catch (regError) {
      if (regError.response?.status === 400) {
        console.log('🔄 User exists, trying login...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
          email: 'test@example.com',
          password: 'password123'
        });
        console.log('✅ User login passed');
        token = loginResponse.data.token;
        console.log('Token received:', token.substring(0, 20) + '...');
      } else {
        throw regError;
      }
    }
    
    // Test 3: Create Poll
    console.log('\n3️⃣ Testing Poll Creation');
    const pollResponse = await axios.post(`${baseURL}/api/polls`, {
      question: 'Test Poll Question?',
      options: ['Option A', 'Option B', 'Option C']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Poll creation passed');
    const pollId = pollResponse.data.id;
    console.log('Poll ID:', pollId);
    
    // Test 4: Get Polls
    console.log('\n4️⃣ Testing Get Polls');
    const pollsResponse = await axios.get(`${baseURL}/api/polls`);
    console.log('✅ Get polls passed');
    console.log('Found', pollsResponse.data.polls.length, 'polls');
    
    // Test 5: Vote on Poll
    console.log('\n5️⃣ Testing Vote Submission');
    const voteResponse = await axios.post(`${baseURL}/api/polls/${pollId}/vote`, {
      optionIndex: 0
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Vote submission passed');
    console.log('Vote response:', voteResponse.data);
    
    // Test 6: Get Poll Results
    console.log('\n6️⃣ Testing Poll Results');
    const resultsResponse = await axios.get(`${baseURL}/api/polls/${pollId}`);
    console.log('✅ Poll results passed');
    console.log('Poll data:', resultsResponse.data);
    
    console.log('\n🎉 All tests passed!');
    console.log('==================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testAPI();
