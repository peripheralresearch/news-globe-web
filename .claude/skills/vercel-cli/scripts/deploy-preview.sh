#!/bin/bash

# Create a preview deployment
# Safe for any branch, creates unique URL

set -e

echo "========================================="
echo "  VERCEL PREVIEW DEPLOYMENT"
echo "  Project: news-globe-web"
echo "  Organization: peripheral"
echo "========================================="
echo ""

# Show current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Deploying from branch: $CURRENT_BRANCH"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes."
    echo "These changes will NOT be included in the deployment."
    echo ""
    read -p "Continue anyway? (yes/no): " CONTINUE
    if [ "$CONTINUE" != "yes" ]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

echo "🔄 Creating preview deployment..."
echo ""

# Run vercel preview deployment
vercel

echo ""
echo "✅ Preview deployment complete!"
echo ""
echo "Your preview URL has been generated above."
echo "Share this URL for testing and review."
echo ""
echo "To list all deployments: vercel ls"