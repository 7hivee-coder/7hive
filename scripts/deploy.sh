#!/bin/bash

echo "🚀 7hive Deployment Script"
echo "=========================="
echo ""

if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file from .env.example"
    exit 1
fi

echo "📦 Pulling latest changes..."
if [ -d .git ]; then
    git pull
else
    echo "⚠️  Not a git repository, skipping pull"
fi

echo ""
echo "🛑 Stopping existing containers..."
docker compose down

echo ""
echo "🏗️  Building containers..."
docker compose build --no-cache

echo ""
echo "🚀 Starting containers..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "📊 Container Status:"
docker compose ps

echo ""
echo "📝 Recent Logs:"
docker compose logs --tail=50

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 To view live logs: docker compose logs -f"
echo "🔍 To check status: docker compose ps"
echo "🛑 To stop: docker compose down"
