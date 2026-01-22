#!/bin/bash

# View deployment logs
# Usage: ./logs-view.sh [deployment-url]

set -e

echo "========================================="
echo "  VERCEL DEPLOYMENT LOGS"
echo "  Project: news-globe-web"
echo "  Organization: peripheral"
echo "========================================="
echo ""

if [ $# -eq 0 ]; then
    echo "Fetching logs for the latest deployment..."
    echo ""
    vercel logs
else
    DEPLOYMENT="$1"
    echo "Fetching logs for: $DEPLOYMENT"
    echo ""
    vercel logs "$DEPLOYMENT"
fi

echo ""
echo "========================================="
echo ""
echo "Tip: Use 'vercel ls' to see all deployments"
echo "Then run: ./logs-view.sh <deployment-url>"