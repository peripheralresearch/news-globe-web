#!/bin/bash

# Add environment variable securely
# Usage: echo -n "value" | ./env-add.sh KEY_NAME environment
# Or: ./env-add.sh KEY_NAME environment (interactive)

set -e

# Check arguments
if [ $# -ne 2 ]; then
    echo "Usage: ./env-add.sh <KEY_NAME> <environment>"
    echo ""
    echo "Environments: production, preview, development"
    echo ""
    echo "Examples:"
    echo "  echo -n 'secret' | ./env-add.sh API_KEY production"
    echo "  ./env-add.sh DATABASE_URL preview  # Interactive"
    exit 1
fi

KEY_NAME="$1"
ENVIRONMENT="$2"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(production|preview|development)$ ]]; then
    echo "❌ Error: Invalid environment '$ENVIRONMENT'"
    echo "Valid options: production, preview, development"
    exit 1
fi

echo "========================================="
echo "  ADD ENVIRONMENT VARIABLE"
echo "  Project: news-globe-web"
echo "  Organization: peripheral"
echo "========================================="
echo ""
echo "Variable: $KEY_NAME"
echo "Environment: $ENVIRONMENT"
echo ""

# Check if stdin has data
if [ -t 0 ]; then
    # No stdin data, use interactive mode
    echo "Enter value (input will be hidden):"
    read -s VALUE
    echo ""

    if [ -z "$VALUE" ]; then
        echo "❌ Error: No value provided"
        exit 1
    fi

    # Add the environment variable
    echo -n "$VALUE" | vercel env add "$KEY_NAME" "$ENVIRONMENT"
else
    # Read from stdin
    echo "Reading value from stdin..."
    vercel env add "$KEY_NAME" "$ENVIRONMENT"
fi

echo ""
echo "✅ Environment variable added successfully!"
echo ""
echo "Variable '$KEY_NAME' has been added to $ENVIRONMENT environment."
echo ""
echo "Note: You may need to redeploy for changes to take effect."
echo "Use ./deploy-preview.sh or ./deploy-prod.sh to redeploy."