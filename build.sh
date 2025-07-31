#!/bin/bash

# Install dependencies
npm install

# Build the frontend
echo "Building frontend..."
npm run build

echo "Build completed successfully!"
echo "Frontend built to: dist/public"
echo "Backend built to: dist/index.js"