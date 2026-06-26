# EduSphere Pro - Deployment Guide

## Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- PostgreSQL 16 (optional, for external DB)
- Node.js 20+ (for local development)

### Local Development

1. **Clone and setup:**
```bash
git clone <repository-url>
cd edusphere-pro
```

2. **Environment configuration:**
```bash
cp .env.production .env
# Edit .env and change all passwords/secrets
```

3. **Start all services:**
```bash
docker compose up
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- API Documentation: http://localhost:8000/api/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## Production Deployment

### Option 1: Docker Compose (Single Server)

1. **Prepare server:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Deploy application:**
```bash
# Clone repository
git clone <repository-url>
cd edusphere-pro

# Setup environment
cp .env.production .env
nano .env  # Edit with production values

# Build and start
docker-compose build
docker-compose run api npx prisma migrate deploy
docker-compose run api npx prisma db seed
docker-compose up -d

# Check logs
docker-compose logs -f
```

3. **Verify deployment:**
```bash
# Check all services are running
docker-compose ps

# Test API
curl http://localhost/api/health

# Test frontend
curl http://localhost
```

### Option 2: Manual Deployment (VPS)

1. **Backend deployment:**
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Setup database
sudo -u postgres psql
CREATE DATABASE edusphere_pro;
CREATE USER edusphere WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE edusphere_pro TO edusphere;
\q

# Clone and setup backend
git clone <repository-url>
cd edusphere-pro/apps/backend
npm install
npm run build

# Setup environment
cp .env.example .env
nano .env  # Configure

# Run migrations
npx prisma migrate deploy
npx prisma db seed

# Start with PM2
npm install -g pm2
pm2 start dist/main --name edusphere-api
pm2 save
pm2 startup
```

2. **Frontend deployment:**
```bash
cd ../frontend
npm install
npm run build

# Start with PM2
pm2 start npm --name edusphere-frontend -- start
pm2 save
```

3. **Nginx configuration:**
```bash
sudo apt install -y nginx

# Copy config
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

1. **Install Certbot:**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

2. **Obtain certificate:**
```bash
sudo certbot --nginx -d your-domain.com
```

3. **Auto-renewal:**
```bash
sudo certbot renew --dry-run
```

4. **Update nginx.conf:**
Uncomment the HTTPS server block and configure with your domain.

---

## Environment Variables

### Required Variables

```env
# Database
POSTGRES_USER=edusphere
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=edusphere_pro

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=<32+-char-random-string>
JWT_REFRESH_SECRET=<32+-char-random-string>

# Application
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### Optional Variables

```env
# JWT TTL
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis (for session storage)
REDIS_HOST=redis
REDIS_PORT=6379

# Server Ports
API_PORT=8000
FRONTEND_PORT=3000
```

---

## Database Management

### Migrations

```bash
# Run pending migrations
docker-compose exec api npx prisma migrate deploy

# Create new migration
docker-compose exec api npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
docker-compose exec api npx prisma migrate reset
```

### Seeding

```bash
# Run seed script
docker-compose exec api npx prisma db seed

# Or with custom seed
docker-compose exec api npx prisma db seed --seed apps/backend/src/seed/seed-data.ts
```

### Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U edusphere edusphere_pro > backup.sql

# Restore database
docker-compose exec -T postgres psql -U edusphere edusphere_pro < backup.sql
```

---

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost/api/health

# Database health
docker-compose exec postgres pg_isready -U edusphere

# Redis health
docker-compose exec redis redis-cli ping
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f nginx

# Last 100 lines
docker-compose logs --tail=100 api
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a
```

---

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  api:
    # Remove "ports" section
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

### Load Balancing

Nginx already configured for load balancing. Add more upstream servers:

```nginx
upstream api {
    server api:8000;
    server api2:8000;
    server api3:8000;
}
```

---

## Security Checklist

- [x] Non-root containers
- [x] Environment variables for secrets
- [x] Health checks enabled
- [x] Rate limiting configured
- [x] Security headers in Nginx
- [x] Database credentials secured
- [x] JWT secrets are strong (32+ chars)
- [x] CORS configured
- [x] HTTPS ready (SSL cert needed)
- [x] Network isolation (Docker network)
- [x] Volume persistence for data
- [x] Restart policies set

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs api

# Common issues:
# 1. Database not ready - wait for health check
# 2. Port already in use - change ports in docker-compose.yml
# 3. Missing env vars - check .env file
```

### Database connection issues

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check credentials
docker-compose exec postgres psql -U edusphere -c "SELECT 1"

# Verify DATABASE_URL format
echo $DATABASE_URL
```

### Frontend can't connect to API

```bash
# Check CORS settings in backend
# Verify NEXT_PUBLIC_API_URL in .env
# Check Nginx proxy configuration
```

### Performance issues

```bash
# Check resource usage
docker stats

# Increase resources in Docker Desktop
# Check database indexes (already configured)
# Enable Redis caching
```

---

## CI/CD Pipeline

### GitHub Actions

The repository includes `.github/workflows/deploy.yml` for automated deployment.

**Pipeline triggers:**
- Push to `main` branch
- Pull requests to `main`

**Steps:**
1. Install dependencies
2. Run tests
3. Build Docker images
4. Deploy to server (via SSH)

### Setup CI/CD

1. **Add secrets to GitHub:**
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`
   - `SSH_PRIVATE_KEY`
   - `SSH_HOST`
   - `SSH_USER`

2. **Update workflow:**
   Edit `.github/workflows/deploy.yml` with your server details.

3. **Push to trigger:**
```bash
git add .
git commit -m "feat: production deployment"
git push origin main
```

---

## Backup Strategy

### Automated Backups

Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U edusphere edusphere_pro > /backups/db_$DATE.sql
# Keep only last 7 days
find /backups -name "db_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

---

## Maintenance

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec api npx prisma migrate deploy
```

### Zero-Downtime Deployment

```bash
# Build new images
docker-compose build

# Start new containers
docker-compose up -d --no-deps --build api
docker-compose up -d --no-deps --build frontend

# Remove old containers
docker-compose rm -f api frontend
```

---

## Support

### Useful Commands

```bash
# Restart specific service
docker-compose restart api

# View service logs
docker-compose logs -f api

# Execute command in container
docker-compose exec api sh

# Database shell
docker-compose exec postgres psql -U edusphere edusphere_pro

# Redis CLI
docker-compose exec redis redis-cli

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Performance Tuning

1. **Database:**
   - Connection pooling (already configured in Prisma)
   - Indexes (already added)
   - Regular VACUUM

2. **Application:**
   - Enable Redis caching
   - Use CDN for static assets
   - Enable gzip (already in Nginx)

3. **Infrastructure:**
   - Use SSD storage
   - Increase RAM for database
   - Consider read replicas for scaling

---

## Emergency Procedures

### Rollback

```bash
# Previous version
git log --oneline
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Database Recovery

```bash
# Restore from backup
docker-compose exec -T postgres psql -U edusphere edusphere_pro < backup.sql

# Or from specific backup
docker-compose exec -T postgres psql -U edusphere edusphere_pro < /backups/db_20240101_120000.sql
```

### Service Recovery

```bash
# Restart all services
docker-compose restart

# If database is corrupted
docker-compose down
docker-compose up -d postgres redis
# Wait 30 seconds
docker-compose up -d api
docker-compose up -d frontend
docker-compose up -d nginx
```

---

## Production Checklist

Before going live:

- [ ] Change all default passwords in `.env`
- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Configure domain name in Nginx
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Configure firewall (UFW/iptables)
- [ ] Setup automated backups
- [ ] Configure monitoring (optional: Prometheus/Grafana)
- [ ] Test all user roles
- [ ] Verify email notifications (if implemented)
- [ ] Load testing
- [ ] Security audit
- [ ] Backup verification

---

## Success Metrics

After deployment, verify:

- ✅ All services running: `docker-compose ps`
- ✅ API responding: `curl http://localhost/api/health`
- ✅ Frontend loading: `curl http://localhost`
- ✅ Database connected: Check API logs
- ✅ Redis connected: Check API logs
- ✅ Users can login
- ✅ Permissions working
- ✅ Dynamic workspace loading
- ✅ AI Copilot accessible

---

## Contact

For issues:
1. Check logs: `docker-compose logs -f`
2. Review this guide
3. Check PRODUCTION_READINESS.md
4. Open GitHub issue