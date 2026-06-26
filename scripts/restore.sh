#!/bin/bash
# EduSphere Pro - Database Restore Script
# Restore PostgreSQL database from backup

set -e

# Configuration
BACKUP_DIR="/backup/postgres"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/edusphere_pro_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    # Try with backup directory prefix
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        log "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
        exit 1
    fi
fi

log "${YELLOW}⚠️  WARNING: This will replace the current database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log "Restore cancelled"
    exit 0
fi

log "${GREEN}Starting database restore...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log "${RED}Error: Docker is not running${NC}"
    exit 1
fi

# Check if postgres container is running
if ! docker compose ps postgres | grep -q "running"; then
    log "${RED}Error: PostgreSQL container is not running${NC}"
    exit 1
fi

# Stop API container to prevent connections
log "Stopping API container..."
docker compose stop api

# Drop and recreate database
log "Recreating database..."
docker compose exec -T postgres psql -U edusphere -c "DROP DATABASE IF EXISTS edusphere_pro;"
docker compose exec -T postgres psql -U edusphere -c "CREATE DATABASE edusphere_pro;"

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log "Decompressing backup..."
    gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U edusphere edusphere_pro
else
    log "Restoring from SQL file..."
    docker compose exec -T postgres psql -U edusphere edusphere_pro < "$BACKUP_FILE"
fi

# Verify restore
log "Verifying restore..."
TABLES=$(docker compose exec -T postgres psql -U edusphere edusphere_pro -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
log "Tables restored: $TABLES"

# Restart API container
log "Starting API container..."
docker compose start api

# Wait for API to be ready
log "Waiting for API to be ready..."
sleep 10

# Health check
log "Performing health check..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    log "${GREEN}✅ Database restored successfully!${NC}"
    log "API is healthy and ready"
else
    log "${YELLOW}⚠️  API health check failed. Check logs: docker compose logs api${NC}"
fi

log "${GREEN}Restore completed${NC}"