#!/bin/bash

# Image Proxy Testing Script
# Usage: ./test-proxy.sh
# Tests the image proxy API with various scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if server is running
check_server() {
  if ! curl -s "http://localhost:3000" > /dev/null 2>&1; then
    echo -e "${RED}Error: Server is not running at http://localhost:3000${NC}"
    echo "Start with: npm run dev"
    exit 1
  fi
}

# Test helper function
test_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"

  echo -e "\n${BLUE}Test: $name${NC}"
  echo "URL: $url"

  response=$(curl -s -w "\n%{http_code}" "$url")
  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -n 1)

  echo "Status: $status"

  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    return 0
  else
    echo -e "${RED}✗ FAIL (expected $expected_status, got $status)${NC}"
    echo "Response: $body"
    return 1
  fi
}

# Test 1: Valid public image
test_valid_image() {
  echo -e "\n${YELLOW}=== Test 1: Valid Public Image ===${NC}"

  local url="http://localhost:3000/api/proxy-image?url=https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/1200px-Cat_November_2010-1a.jpg"

  echo "Fetching: Wikipedia cat image"
  response=$(curl -s -w "\n%{http_code}" -H "Accept: image/*" "$url")
  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -n 1)

  echo "Status: $status"

  if [ "$status" = "200" ]; then
    # Check if response is actually image data (should have magic bytes)
    if echo "$body" | file - | grep -q "image"; then
      echo -e "${GREEN}✓ PASS - Image returned successfully${NC}"
      return 0
    else
      echo -e "${YELLOW}⚠ WARNING - Response is 200 but might not be image data${NC}"
      return 1
    fi
  else
    echo -e "${RED}✗ FAIL (expected 200, got $status)${NC}"
    return 1
  fi
}

# Test 2: Missing URL parameter
test_missing_url() {
  echo -e "\n${YELLOW}=== Test 2: Missing URL Parameter ===${NC}"

  local url="http://localhost:3000/api/proxy-image"
  test_endpoint "Missing URL" "$url" "400"
}

# Test 3: Invalid URL format
test_invalid_url() {
  echo -e "\n${YELLOW}=== Test 3: Invalid URL Format ===${NC}"

  local url="http://localhost:3000/api/proxy-image?url=not-a-valid-url"
  test_endpoint "Invalid URL" "$url" "400"
}

# Test 4: Private IP blocked
test_private_ip() {
  echo -e "\n${YELLOW}=== Test 4: Private IP Blocked ===${NC}"

  local url="http://localhost:3000/api/proxy-image?url=http://192.168.1.1/image.jpg"
  test_endpoint "Private IP (192.168.x.x)" "$url" "400"
}

# Test 5: Localhost blocked
test_localhost() {
  echo -e "\n${YELLOW}=== Test 5: Localhost Blocked ===${NC}"

  local url="http://localhost:3000/api/proxy-image?url=http://localhost:8000/image.jpg"
  test_endpoint "Localhost" "$url" "400"
}

# Test 6: Non-image content
test_non_image() {
  echo -e "\n${YELLOW}=== Test 6: Non-Image Content Rejected ===${NC}"

  local url="http://localhost:3000/api/proxy-image?url=https://example.com"

  echo "Fetching: HTML page (should be rejected)"
  response=$(curl -s -w "\n%{http_code}" "$url")
  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -n 1)

  echo "Status: $status"

  if [ "$status" = "400" ] || [ "$status" = "404" ]; then
    echo -e "${GREEN}✓ PASS - Non-image rejected${NC}"
    return 0
  else
    echo -e "${RED}✗ FAIL (expected 400/404, got $status)${NC}"
    return 1
  fi
}

# Test 7: Cache headers
test_cache_headers() {
  echo -e "\n${YELLOW}=== Test 7: Cache Headers ===${NC}"

  local url="http://localhost:3000/api/proxy-image?url=https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/1200px-Cat_November_2010-1a.jpg"

  echo "Checking: Cache-Control headers"
  response=$(curl -s -i "$url" 2>&1)

  if echo "$response" | grep -q "Cache-Control"; then
    if echo "$response" | grep -q "max-age=86400"; then
      echo -e "${GREEN}✓ PASS - Cache headers correct (24 hours)${NC}"
      return 0
    else
      echo -e "${YELLOW}⚠ WARNING - Cache header present but not 24 hours${NC}"
      echo "$response" | grep "Cache-Control"
      return 1
    fi
  else
    echo -e "${RED}✗ FAIL - No Cache-Control header${NC}"
    return 1
  fi
}

# Test 8: CORS headers
test_cors_headers() {
  echo -e "\n${YELLOW}=== Test 8: CORS Headers ===${NC}"

  local url="http://localhost:3000/api/proxy-image?url=https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/1200px-Cat_November_2010-1a.jpg"

  echo "Checking: CORS headers"
  response=$(curl -s -i "$url" 2>&1)

  if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ PASS - CORS headers present${NC}"
    echo "$response" | grep "Access-Control"
    return 0
  else
    echo -e "${RED}✗ FAIL - No CORS headers${NC}"
    return 1
  fi
}

# Test 9: OPTIONS request
test_options() {
  echo -e "\n${YELLOW}=== Test 9: OPTIONS Preflight ===${NC}"

  local url="http://localhost:3000/api/proxy-image"

  echo "Testing: OPTIONS request"
  response=$(curl -s -X OPTIONS -i "$url" 2>&1)
  status=$(echo "$response" | grep "HTTP" | awk '{print $2}')

  echo "Status: $status"

  if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ PASS - OPTIONS request handled${NC}"
    return 0
  else
    echo -e "${RED}✗ FAIL (expected 200, got $status)${NC}"
    return 1
  fi
}

# Test 10: Timeout behavior (optional, slow)
test_timeout() {
  echo -e "\n${YELLOW}=== Test 10: Timeout Handling (Slow Test - ~20s) ===${NC}"

  local url="http://localhost:3000/api/proxy-image?url=https://httpbin.org/delay/20"

  echo "Testing: 20-second delay (proxy timeout is 15s)"
  echo "This will take ~20 seconds..."

  response=$(curl -s -w "\n%{http_code}" --max-time 25 "$url")
  status=$(echo "$response" | tail -n 1)

  echo "Status: $status"

  if [ "$status" = "504" ]; then
    echo -e "${GREEN}✓ PASS - Timeout handled correctly (504)${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠ WARNING - Expected 504, got $status (might be httpbin issue)${NC}"
    return 1
  fi
}

# Main execution
main() {
  echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Image Proxy API Test Suite            ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

  # Check server
  echo -e "\n${BLUE}Checking if server is running...${NC}"
  check_server
  echo -e "${GREEN}✓ Server is running${NC}"

  # Run tests
  passed=0
  failed=0

  # Quick tests (no timeout)
  test_missing_url && ((passed++)) || ((failed++))
  test_invalid_url && ((passed++)) || ((failed++))
  test_private_ip && ((passed++)) || ((failed++))
  test_localhost && ((passed++)) || ((failed++))
  test_non_image && ((passed++)) || ((failed++))
  test_valid_image && ((passed++)) || ((failed++))
  test_cache_headers && ((passed++)) || ((failed++))
  test_cors_headers && ((passed++)) || ((failed++))
  test_options && ((passed++)) || ((failed++))

  # Optional slow test
  read -p "Run timeout test? (takes ~20s) [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    test_timeout && ((passed++)) || ((failed++))
  fi

  # Summary
  echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Test Summary                          ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

  total=$((passed + failed))

  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All $total tests passed!${NC}"
    echo -e "\n${GREEN}Proxy API is working correctly.${NC}"
    exit 0
  else
    echo -e "${RED}✗ $failed of $total tests failed${NC}"
    echo -e "\n${RED}Please review the failures above.${NC}"
    exit 1
  fi
}

# Run main
main
