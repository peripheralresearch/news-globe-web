#!/bin/bash

# List all environment variables for the project
# Never shows actual values, only variable names

set -e

echo "========================================="
echo "  ENVIRONMENT VARIABLES"
echo "  Project: news-globe-web"
echo "  Organization: peripheral"
echo "========================================="
echo ""

# Run vercel env ls command
vercel env ls

echo ""
echo "Note: Values are hidden for security."
echo "To add a new variable, use: ./env-add.sh"
echo "To remove a variable, use: vercel env rm <KEY>"