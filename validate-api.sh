#!/bin/bash

# 🧪 Comprehensive API Validation Script
# Move37 Ventures Backend Developer Challenge
# Tests all RESTful endpoints for functionality and data handling

set -e  # Exit on any error

echo "🚀 ================================"
echo "🚀 API Functionality Validation"
echo "🚀 ================================"

# Configuration
API_BASE="http://localhost:3000"
TEST_USER_EMAIL="test@move37.com"
TEST_USER_PASSWORD="SecurePassword123!"
TEST_USER_NAME="Test User"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if server is running
check_server() {
    print_info "Checking if server is running..."
    
    if curl -s "$API_BASE/health" > /dev/null; then
        print_success "Server is running"
        return 0
    else
        print_error "Server is not running. Please start the server first."
        echo "Run: npm run dev"
        exit 1
    fi
}

# Test 1: Health Check
test_health_check() {
    print_info "Testing health check endpoint..."
    
    response=$(curl -s "$API_BASE/health")
    
    if echo "$response" | grep -q '"status":"OK"'; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 2: User Registration
test_user_registration() {
    print_info "Testing user registration..."
    
    response=$(curl -s -X POST "$API_BASE/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$TEST_USER_NAME\",
            \"email\": \"$TEST_USER_EMAIL\",
            \"password\": \"$TEST_USER_PASSWORD\"
        }")
    
    if echo "$response" | grep -q '"message":"User registered successfully"'; then
        print_success "User registration passed"
        # Extract token for future requests
        ACCESS_TOKEN=$(echo "$response" | jq -r '.tokens.accessToken')
        export ACCESS_TOKEN
    else
        print_warning "User registration may have failed (user might already exist)"
        echo "Response: $response"
        
        # Try login instead
        print_info "Attempting login with existing user..."
        login_response=$(curl -s -X POST "$API_BASE/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "{
                \"email\": \"$TEST_USER_EMAIL\",
                \"password\": \"$TEST_USER_PASSWORD\"
            }")
        
        if echo "$login_response" | grep -q '"message":"Login successful"'; then
            print_success "Login successful"
            ACCESS_TOKEN=$(echo "$login_response" | jq -r '.tokens.accessToken')
            export ACCESS_TOKEN
        else
            print_error "Both registration and login failed"
            echo "Login response: $login_response"
            exit 1
        fi
    fi
}

# Test 3: User Profile
test_user_profile() {
    print_info "Testing user profile endpoint..."
    
    response=$(curl -s -X GET "$API_BASE/api/users/profile" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$response" | grep -q '"email"'; then
        print_success "User profile retrieval passed"
    else
        print_error "User profile retrieval failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 4: Poll Creation
test_poll_creation() {
    print_info "Testing poll creation..."
    
    response=$(curl -s -X POST "$API_BASE/api/polls" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d '{
            "question": "What is your favorite backend framework?",
            "options": [
                {"text": "Express.js"},
                {"text": "NestJS"},
                {"text": "FastAPI"},
                {"text": "Spring Boot"}
            ]
        }')
    
    if echo "$response" | grep -q '"message":"Poll created successfully"'; then
        print_success "Poll creation passed"
        # Extract poll ID for future tests
        POLL_ID=$(echo "$response" | jq -r '.poll.id')
        POLL_OPTION_ID=$(echo "$response" | jq -r '.poll.options[0].id')
        export POLL_ID
        export POLL_OPTION_ID
    else
        print_error "Poll creation failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 5: Get All Polls
test_get_polls() {
    print_info "Testing get all polls endpoint..."
    
    response=$(curl -s -X GET "$API_BASE/api/polls")
    
    if echo "$response" | grep -q '"polls"'; then
        print_success "Get all polls passed"
    else
        print_error "Get all polls failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 6: Get Single Poll
test_get_single_poll() {
    print_info "Testing get single poll endpoint..."
    
    response=$(curl -s -X GET "$API_BASE/api/polls/$POLL_ID")
    
    if echo "$response" | grep -q '"poll"'; then
        print_success "Get single poll passed"
    else
        print_error "Get single poll failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 7: Publish Poll
test_publish_poll() {
    print_info "Testing poll publishing..."
    
    response=$(curl -s -X PUT "$API_BASE/api/polls/$POLL_ID/publish" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$response" | grep -q '"message":"Poll published successfully"'; then
        print_success "Poll publishing passed"
    else
        print_error "Poll publishing failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 8: Vote Submission
test_vote_submission() {
    print_info "Testing vote submission..."
    
    response=$(curl -s -X POST "$API_BASE/api/polls/$POLL_ID/vote" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -d "{
            \"pollOptionId\": \"$POLL_OPTION_ID\"
        }")
    
    if echo "$response" | grep -q '"message":"Vote submitted successfully"'; then
        print_success "Vote submission passed"
    else
        print_error "Vote submission failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 9: Get Poll Results
test_poll_results() {
    print_info "Testing poll results endpoint..."
    
    response=$(curl -s -X GET "$API_BASE/api/polls/$POLL_ID/results")
    
    if echo "$response" | grep -q '"totalVotes"'; then
        print_success "Poll results retrieval passed"
    else
        print_error "Poll results retrieval failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 10: Get User's Vote
test_user_vote() {
    print_info "Testing user's vote retrieval..."
    
    response=$(curl -s -X GET "$API_BASE/api/polls/$POLL_ID/my-vote" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$response" | grep -q '"vote"'; then
        print_success "User's vote retrieval passed"
    else
        print_error "User's vote retrieval failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 11: Get User's Voting History
test_voting_history() {
    print_info "Testing user's voting history..."
    
    response=$(curl -s -X GET "$API_BASE/api/votes/my-votes" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$response" | grep -q '"votes"'; then
        print_success "Voting history retrieval passed"
    else
        print_error "Voting history retrieval failed"
        echo "Response: $response"
        exit 1
    fi
}

# Test 12: Error Handling (Invalid endpoints)
test_error_handling() {
    print_info "Testing error handling..."
    
    # Test 404 for non-existent endpoint
    response=$(curl -s -w "%{http_code}" "$API_BASE/api/nonexistent")
    http_code="${response: -3}"
    
    if [ "$http_code" = "404" ]; then
        print_success "404 error handling passed"
    else
        print_error "404 error handling failed (got $http_code)"
        exit 1
    fi
    
    # Test unauthorized access
    response=$(curl -s -w "%{http_code}" -X GET "$API_BASE/api/users/profile")
    http_code="${response: -3}"
    
    if [ "$http_code" = "401" ]; then
        print_success "Unauthorized access handling passed"
    else
        print_error "Unauthorized access handling failed (got $http_code)"
        exit 1
    fi
}

# Main execution
main() {
    print_info "Starting comprehensive API validation..."
    echo ""
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        print_error "jq is required for this script. Please install it:"
        echo "macOS: brew install jq"
        echo "Ubuntu: sudo apt-get install jq"
        exit 1
    fi
    
    # Run all tests
    check_server
    test_health_check
    test_user_registration
    test_user_profile
    test_poll_creation
    test_get_polls
    test_get_single_poll
    test_publish_poll
    test_vote_submission
    test_poll_results
    test_user_vote
    test_voting_history
    test_error_handling
    
    echo ""
    print_success "🎉 ALL API TESTS PASSED!"
    echo ""
    print_info "Summary of validated functionality:"
    echo "  ✅ User authentication (register/login)"
    echo "  ✅ User profile management"
    echo "  ✅ Poll CRUD operations"
    echo "  ✅ Vote submission and tracking"
    echo "  ✅ Poll results and analytics"
    echo "  ✅ Error handling and security"
    echo ""
    print_success "API is ready for Move37 submission! 🚀"
}

# Execute main function
main "$@"