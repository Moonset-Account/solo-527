#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
BACKUP_DIR="$PROJECT_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "========================================="
echo "  数据库备份脚本"
echo "========================================="

mkdir -p "$BACKUP_DIR"

echo ""
echo "备份目录: $BACKUP_DIR"
echo "备份时间: $DATE"
echo ""

step "备份 PostgreSQL 数据库..."
set -a
source "$PROJECT_DIR/.env"
set +a

BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

docker-compose -f "$PROJECT_DIR/docker-compose.yml" exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

echo "数据库备份完成: $BACKUP_FILE"

step "压缩备份文件..."
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "压缩完成: $BACKUP_FILE"

step "清理旧备份（保留7天）..."
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "旧备份已清理"

echo ""
echo "备份完成！"
echo "备份文件: $BACKUP_FILE"
echo "文件大小: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
