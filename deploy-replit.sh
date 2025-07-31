#!/bin/bash

# 🚀 PediaSignal AI - Replit Deployment Script
# This script automates the deployment process on Replit

echo "🚀 Starting PediaSignal AI deployment on Replit..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Check TypeScript compilation
echo "🔍 Checking TypeScript compilation..."
npm run check

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Step 3: Build the project
echo "🏗️ Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Step 4: Set up database (if needed)
echo "🗄️ Setting up database..."
npm run db:push

# Step 5: Start the application
echo "🚀 Starting the application..."
npm run start

echo "🎉 Deployment complete! Your PediaSignal AI platform is now running."
echo "📊 Available features:"
echo "   - Enhanced Emergency Simulator with random case generation"
echo "   - Improved X-ray Analysis with better validation"
echo "   - Advanced Misinformation Monitor with batch processing"
echo "   - Real-time statistics and performance evaluation" 