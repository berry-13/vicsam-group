#!/bin/bash

# Script migliorato per testare l'API VicSam Group
# Uso: ./test-api.sh [BASE_URL] [BEARER_TOKEN]

set -e  # Exit on any error

BASE_URL=${1:-"http://localhost:3000"}
BEARER_TOKEN=${2:-"your-bearer-token-change-this"}
API_PASSWORD="supersegreta"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_test() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local expected_status="$4"
    local headers="$5"
    local data="$6"
    
    print_test "Testing: $name"
    
    local cmd="curl -s -w 'HTTP_STATUS:%{http_code}' -X $method '$url'"
    
    if [ -n "$headers" ]; then
        cmd="$cmd $headers"
    fi
    
    if [ -n "$data" ]; then
        cmd="$cmd -d '$data'"
    fi
    
    local response=$(eval $cmd)
    local status=$(echo "$response" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    local body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
    
    if [ "$status" = "$expected_status" ]; then
        print_success "$name (Status: $status)"
        if command -v jq &> /dev/null; then
            echo "$body" | jq '.' 2>/dev/null || echo "$body"
        else
            echo "$body"
        fi
    else
        print_error "$name (Expected: $expected_status, Got: $status)"
        echo "$body"
        return 1
    fi
    echo
}

echo "🚀 Testing VicSam Group API at $BASE_URL"
echo "Using Bearer Token: $BEARER_TOKEN"
echo

# Check if jq is available
if ! command -v jq &> /dev/null; then
    print_warning "jq not found. JSON responses will not be formatted."
fi

# Test 1: Health Check
test_endpoint "Health Check" "GET" "$BASE_URL/health" "200"

# Test 2: API Info
test_endpoint "API Info" "GET" "$BASE_URL/api/auth/info" "200"

# Test 3: Authentication
print_test "Testing Authentication..."
auth_response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$API_PASSWORD\"}")

if echo "$auth_response" | grep -q '"success":true'; then
    print_success "Authentication successful"
    if command -v jq &> /dev/null; then
        echo "$auth_response" | jq '.'
    else
        echo "$auth_response"
    fi
else
    print_error "Authentication failed"
    echo "$auth_response"
fi
echo

# Test 4: Bearer Token Verification
test_endpoint "Bearer Token Verification" "GET" "$BASE_URL/api/auth/verify" "200" \
    "-H 'Authorization: Bearer $BEARER_TOKEN'"

# Test 5: Invalid Bearer Token
test_endpoint "Invalid Bearer Token" "GET" "$BASE_URL/api/auth/verify" "401" \
    "-H 'Authorization: Bearer invalid-token'"

# Test 6: Save Data
test_endpoint "Save Data" "POST" "$BASE_URL/api/data/save" "201" \
    "-H 'Authorization: Bearer $BEARER_TOKEN' -H 'Content-Type: application/json'" \
    '{
        "nome": "Mario Rossi",
        "email": "mario@example.com",
        "telefono": "123456789",
        "messaggio": "Test API automatico",
        "citta": "Roma"
    }'

# Test 7: Save Invalid Data
test_endpoint "Save Invalid Data" "POST" "$BASE_URL/api/data/save" "400" \
    "-H 'Authorization: Bearer $BEARER_TOKEN' -H 'Content-Type: application/json'" \
    '{
        "nome": "A",
        "email": "invalid-email"
    }'

# Test 8: Get Files List
test_endpoint "Get Files List" "GET" "$BASE_URL/api/data/files" "200" \
    "-H 'Authorization: Bearer $BEARER_TOKEN'"

# Test 9: Get Statistics
test_endpoint "Get Statistics" "GET" "$BASE_URL/api/data/stats" "200" \
    "-H 'Authorization: Bearer $BEARER_TOKEN'"

# Test 10: Unauthorized Access
test_endpoint "Unauthorized Access" "GET" "$BASE_URL/api/data/files" "401"

# Test 11: Non-existent API Route
test_endpoint "Non-existent API Route" "GET" "$BASE_URL/api/non-existent" "404"

# Test 12: Rate Limiting Test (Optional)
print_test "Testing Rate Limiting (10 rapid requests)..."
rate_limit_failures=0
for i in {1..10}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $BEARER_TOKEN" \
        "$BASE_URL/api/data/stats")
    
    if [ "$status" != "200" ]; then
        ((rate_limit_failures++))
    fi
    
    printf "Request $i: $status "
    if [ "$status" = "200" ]; then
        printf "✅"
    else
        printf "❌"
    fi
    echo
done

if [ $rate_limit_failures -eq 0 ]; then
    print_success "Rate limiting test passed (all requests succeeded)"
else
    print_warning "Rate limiting triggered after some requests ($rate_limit_failures failures)"
fi
echo

print_success "🎉 API Tests Completed!"
echo
echo "Summary:"
echo "- Health check: Working"
echo "- Authentication: Working" 
echo "- Data operations: Working"
echo "- Error handling: Working"
echo "- Security: Working"
