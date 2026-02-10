#!/bin/bash

# Blind Platform Startup Script

set -e

echo "🚀 Starting Blind Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL and Redis
echo "📦 Starting PostgreSQL and Redis..."
cd docker
docker-compose up -d
cd ..

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push database schema
echo "📊 Applying database schema..."
npm run db:push

# Seed database if it's empty
echo "🌱 Seeding database..."
npm run db:seed || true

# Build the applications
echo "🏗️ Building applications..."
npm run build

# Start the applications
echo "✅ Starting servers..."
echo "   - API: http://localhost:4000"
echo "   - Web: http://localhost:3000"
echo "   - Access at: http://115.68.223.124/blind"
echo ""

# Run in production mode
npm run start
