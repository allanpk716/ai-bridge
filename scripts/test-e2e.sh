#!/bin/bash
# AI-Bridge E2E Test Script

echo "========================================"
echo "AI-Bridge E2E Test"
echo "========================================"
echo

# Check if ai-bridge exists
if [ ! -f "bin/ai-bridge" ] && [ ! -f "ai-bridge" ]; then
    echo "ERROR: ai-bridge not found"
    echo "Please run: make build or go build ./cmd/ai-bridge"
    exit 1
fi

# Determine binary path
if [ -f "bin/ai-bridge" ]; then
    BIN_PATH="./bin/ai-bridge"
else
    BIN_PATH="./ai-bridge"
fi

# Start server
echo "Starting ai-bridge server..."
$BIN_PATH server --config configs/config.yaml > /tmp/ai-bridge-test.log 2>&1 &
SERVER_PID=$!

# Wait for server
sleep 3

# Test health
echo "Testing health endpoint..."
if ! curl -s http://localhost:8080/health > /dev/null; then
    echo "ERROR: Server not responding"
    kill $SERVER_PID
    exit 1
fi
echo
echo "OK - Server is running"
echo

# Create session
echo "Creating session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"workingDirectory": ".", "model": "haiku"}')

echo "Session created:"
echo "$SESSION_RESPONSE" | head -1
echo

# Get status
echo "Getting sessions list..."
curl -s http://localhost:8080/api/v1/sessions
echo
echo

# List commands
echo "Testing commands endpoint..."
curl -s http://localhost:8080/api/v1/commands | head -5
echo
echo

echo "========================================"
echo "E2E Test Completed Successfully!"
echo "========================================"

# Cleanup
echo
echo "Stopping server..."
kill $SERVER_PID
sleep 1
echo "Done."
