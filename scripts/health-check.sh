#!/bin/bash

echo "🏥 7hive Health Check"
echo "===================="
echo ""

echo "📦 Container Status:"
docker compose ps
echo ""

echo "💾 Disk Usage:"
df -h | grep -E "Filesystem|/$"
echo ""

echo "🐳 Docker Disk Usage:"
docker system df
echo ""

echo "🔍 Testing Services:"
echo ""

echo "1️⃣  Frontend (Nginx):"
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
    echo "   ✅ Frontend is responding"
else
    echo "   ❌ Frontend is not responding"
fi
echo ""

echo "2️⃣  Backend API:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/openapi.json | grep -q "200"; then
    echo "   ✅ Backend API is responding"
else
    echo "   ❌ Backend API is not responding"
fi
echo ""

echo "3️⃣  Database:"
if docker exec 7hive-db-1 pg_isready -U sevenhive -d imagedb > /dev/null 2>&1; then
    echo "   ✅ Database is healthy"
else
    echo "   ❌ Database is not healthy"
fi
echo ""

echo "📊 Memory Usage:"
free -h
echo ""

echo "🔥 Top Processes:"
ps aux --sort=-%mem | head -6
echo ""

echo "📝 Recent Errors (if any):"
docker compose logs --tail=20 | grep -i "error\|exception\|failed" | tail -10
