#!/bin/bash
echo "Checking AI-Bridge debug dependencies..."

# Check dev-browser
echo "Checking dev-browser skill..."
# (Note: This would need to be run within Claude Code context)

# Check backend
if curl -s http://localhost:8080/health > /dev/null; then
    echo "[OK] Backend is running on port 8080"
else
    echo "[WARNING] Backend not accessible on http://localhost:8080"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "[OK] Frontend is running on port 3000"
else
    echo "[WARNING] Frontend not accessible on http://localhost:3000"
fi

# Check logs
if [ -d "./logs" ]; then
    echo "[OK] Log directory exists"
    log_count=$(ls -1 ./logs/ai-bridge-*.log 2>/dev/null | wc -l)
    echo "Found $log_count log files"
else
    echo "[WARNING] Log directory not found: ./logs/"
fi

echo ""
echo "Dependency check complete."
