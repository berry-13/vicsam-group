#!/bin/bash

# Script per testare l'API VicSam Group
# Uso: ./test-api.sh [BASE_URL]

BASE_URL=${1:-"http://localhost:3001"}
BEARER_TOKEN="your-bearer-token-change-this"

echo "🚀 Testing VicSam Group API at $BASE_URL"
echo

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s -X GET "$BASE_URL/health" | jq '.'
echo

# Test 2: API Info
echo "2. Testing API Info..."
curl -s -X GET "$BASE_URL/api/auth/info" | jq '.'
echo

# Test 3: Authentication
echo "3. Testing Authentication..."
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"supersegreta"}')
echo "$AUTH_RESPONSE" | jq '.'
echo

# Test 4: Verify Bearer Token
echo "4. Testing Bearer Token Verification..."
curl -s -X GET "$BASE_URL/api/auth/verify" \
  -H "Authorization: Bearer $BEARER_TOKEN" | jq '.'
echo

# Test 5: Save Data
echo "5. Testing Data Save..."
SAVE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/data/save" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Mario Rossi",
    "email": "mario@example.com",
    "telefono": "123456789",
    "messaggio": "Test completo API",
    "citta": "Roma"
  }')
echo "$SAVE_RESPONSE" | jq '.'
echo

# Test 6: Get Files List
echo "6. Testing Files List..."
curl -s -X GET "$BASE_URL/api/data/files" \
  -H "Authorization: Bearer $BEARER_TOKEN" | jq '.'
echo

# Test 7: Get Stats
echo "7. Testing Statistics..."
curl -s -X GET "$BASE_URL/api/data/stats" \
  -H "Authorization: Bearer $BEARER_TOKEN" | jq '.'
echo

# Test 8: Test Rate Limiting (Optional)
echo "8. Testing Rate Limiting (5 rapid requests)..."
for i in {1..5}; do
  echo "Request $i:"
  curl -s -X GET "$BASE_URL/api/data/stats" \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    -w "HTTP Status: %{http_code}\n" \
    -o /dev/null
done
echo

# Test 9: Test Invalid Token
echo "9. Testing Invalid Token..."
curl -s -X GET "$BASE_URL/api/data/files" \
  -H "Authorization: Bearer invalid-token" | jq '.'
echo

# Test 10: Test Missing Token
echo "10. Testing Missing Token..."
curl -s -X GET "$BASE_URL/api/data/files" | jq '.'
echo

echo "✅ API Tests Completed!"
