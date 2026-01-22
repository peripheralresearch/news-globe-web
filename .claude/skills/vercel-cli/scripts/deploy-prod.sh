#!/bin/bash

# Deploy to production environment
# Safety: Requires confirmation before deploying

set -e

echo "========================================="
echo "  VERCEL PRODUCTION DEPLOYMENT"
echo "  Project: news-globe-web"
echo "  Organization: peripheral"
echo "========================================="
echo ""

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo ""
    echo "⚠️  WARNING: You are not on the main branch!"
    echo "Production deployments should typically be from main."
    echo ""
fi

# Confirmation prompt
echo "You are about to deploy to PRODUCTION."
echo "This will affect all live users."
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "🚀 Starting production deployment..."
echo ""

# Run vercel production deployment
vercel --prod

echo ""
echo "✅ Production deployment complete!"
echo ""
echo "View your deployment at: https://news-globe-web.vercel.app"
echo "Or check status with: vercel ls"