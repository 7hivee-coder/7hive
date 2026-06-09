#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="7hive-db-1"

mkdir -p $BACKUP_DIR

echo "🗄️  Starting database backup..."
echo "Backup location: $BACKUP_DIR/backup_$DATE.sql"

if docker ps | grep -q $CONTAINER_NAME; then
    docker exec $CONTAINER_NAME pg_dump -U sevenhive imagedb > $BACKUP_DIR/backup_$DATE.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup completed successfully!"
        
        find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
        echo "🧹 Cleaned up backups older than 7 days"
        
        echo ""
        echo "📊 Current backups:"
        ls -lh $BACKUP_DIR/backup_*.sql 2>/dev/null | tail -5
    else
        echo "❌ Backup failed!"
        exit 1
    fi
else
    echo "❌ Database container not running!"
    exit 1
fi
