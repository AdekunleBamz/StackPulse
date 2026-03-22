#!/bin/bash

# StackPulse Staging Deployment Helper
# Automates the build and push process for staging

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "🚀 Preparing deployment from branch: $BRANCH"

# 1. Run Tests
echo "🧪 Running unit tests..."
npm test || { echo "❌ Tests failed. Aborting."; exit 1; }

# 2. Build Shared
echo "🏗️ Building shared package..."
cd shared && npm install && npm run build && cd ..

# 3. Build Server
echo "🏗️ Building server..."
cd server && npm install && npm run build && cd ..

# 4. Build Frontend
echo "🏗️ Building frontend..."
cd frontend && npm install && npm run build && cd ..

echo "✅ Build successful! Ready to deploy to staging."
