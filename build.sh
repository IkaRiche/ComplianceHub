#!/bin/bash

# Build script for Cloudflare Pages
# This handles the monorepo structure properly

echo "🚀 Starting ComplianceHub build..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build UI
echo "🎨 Building UI..."
cd apps/ui || { echo "❌ Error: apps/ui directory not found"; exit 1; }
npm run build

echo "✅ Build complete! Output in apps/ui/dist"