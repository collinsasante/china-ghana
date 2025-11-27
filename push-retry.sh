#!/bin/bash

# Git Push Retry Script for Unstable Networks
# Usage: ./push-retry.sh

echo "🔄 Attempting to push to GitHub with network optimizations..."
echo ""

# Configure git for poor network conditions
git config http.postBuffer 1048576000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999
git config core.compression 9

# Attempt push with retries
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Attempt $((RETRY_COUNT + 1)) of $MAX_RETRIES..."

    if git push -u origin main --verbose; then
        echo ""
        echo "✅ Push successful!"
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            WAIT_TIME=$((RETRY_COUNT * 10))
            echo "❌ Push failed. Waiting ${WAIT_TIME} seconds before retry..."
            sleep $WAIT_TIME
        fi
    fi
done

echo ""
echo "❌ Failed to push after $MAX_RETRIES attempts."
echo ""
echo "Possible solutions:"
echo "1. Check your internet connection"
echo "2. Try again when network is more stable"
echo "3. Switch to a different network (e.g., mobile hotspot)"
echo "4. Use GitHub Desktop app instead"
echo "5. Visit github.com/collinsasante/china-ghana to check if files were pushed"

exit 1
