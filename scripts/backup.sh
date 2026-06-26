#!/bin/bash
# EduSphere Pro - Database Backup Script
# Automated PostgreSQL backup with retention

set -e

# Configuration
BACKUP_DIR="/backup/postgres"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/edusphere_pro_$TIMESTAMP.sql"
LOG_FILE="$BACKUP_DIR/backup.log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "${GREEN}Starting database backup...${NC}"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

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

# Perform backup
log "Creating backup: $BACKUP_FILE"
if docker compose exec -T postgres pg_dump -U edusphere edusphere_pro > "$BACKUP_FILE"; then
    log "${GREEN}Backup created successfully${NC}"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    log "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Get file size
    SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    log "Backup size: $SIZE"
else
    log "${RED}Backup failed${NC}"
    exit 1
fi

# Remove old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "edusphere_pro_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "edusphere_pro_*.sql.gz" -type f | wc -l)
log "Remaining backups: $REMAINING"

# List all backups
log "Current backups:"
ls -lh "$BACKUP_DIR"/edusphere_pro_*.sql.gz 2>/dev/null | tee -a "$LOG_FILE" || log "No backups found"

log "${GREEN}Backup completed successfully${NC}"
exit 0