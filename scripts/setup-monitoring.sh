#!/bin/bash
# EduSphere Pro - Monitoring Setup Script
# Container and application monitoring

set -e

echo "📊 Setting up monitoring..."

# Create monitoring directory
mkdir -p /opt/edusphere-pro/monitoring
cd /opt/edusphere-pro/monitoring

# Create Prometheus configuration
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
EOF

# Create Grafana datasource configuration
mkdir -p grafana/provisioning/datasources
cat > grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Create Grafana dashboard configuration
mkdir -p grafana/provisioning/dashboards
cat > grafana/provisioning/dashboards/dashboards.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Create docker-compose.monitoring.yml
cat > docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: edusphere-prometheus
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - edusphere-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  grafana:
    image: grafana/grafana:latest
    container_name: edusphere-grafana
    restart: always
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - edusphere-network
    depends_on:
      - prometheus
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  node-exporter:
    image: prom/node-exporter:latest
    container_name: edusphere-node-exporter
    restart: always
    pid: host
    network_mode: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    container_name: edusphere-nginx-exporter
    restart: always
    command:
      - '-nginx.scrape-uri=http://nginx:80/stub_status'
    networks:
      - edusphere-network
    depends_on:
      - nginx

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: edusphere-postgres-exporter
    restart: always
    environment:
      - DATA_SOURCE_NAME=postgresql://edusphere:${POSTGRES_PASSWORD}@postgres:5432/edusphere_pro?sslmode=disable
    networks:
      - edusphere-network
    depends_on:
      - postgres

volumes:
  prometheus_data:
  grafana_data:

networks:
  edusphere-network:
    external: true
EOF

# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
# EduSphere Pro - Health Check Script

echo "🏥 Running health checks..."

# Check Docker containers
echo "📦 Checking Docker containers..."
docker compose ps

# Check API health
echo "🔌 Checking API health..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
fi

# Check database connection
echo "🗄️  Checking database connection..."
if docker compose exec -T postgres pg_isready -U edusphere > /dev/null 2>&1; then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
fi

# Check Redis connection
echo "🔄 Checking Redis connection..."
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
fi

# Check disk space
echo "💾 Checking disk space..."
df -h / | awk 'NR==2 {if ($5 > "90%") print "⚠️  Disk usage critical: "$5; else print "✅ Disk usage: "$5}'

# Check memory usage
echo "🧠 Checking memory usage..."
free -h | awk 'NR==2 {if ($3/$2 > "90%") print "⚠️  Memory usage critical: "$3"/"$2; else print "✅ Memory usage: "$3"/"$2}'

# Check container resource usage
echo "📊 Container resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "Health check completed at $(date)"
EOF

chmod +x health-check.sh

# Create monitoring startup script
cat > start-monitoring.sh << 'EOF'
#!/bin/bash
# Start monitoring stack

echo "📊 Starting monitoring stack..."

docker compose -f docker-compose.monitoring.yml up -d

echo ""
echo "✅ Monitoring started!"
echo ""
echo "Access URLs:"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana: http://localhost:3001"
echo "  Grafana login: admin / ${GRAFANA_PASSWORD:-admin}"
echo ""
echo "Next steps:"
echo "1. Open Grafana: http://localhost:3001"
echo "2. Login with admin / admin"
echo "3. Add Prometheus data source: http://prometheus:9090"
echo "4. Import dashboards or create custom ones"
EOF

chmod +x start-monitoring.sh

# Create stop monitoring script
cat > stop-monitoring.sh << 'EOF'
#!/bin/bash
# Stop monitoring stack

echo "🛑 Stopping monitoring stack..."

docker compose -f docker-compose.monitoring.yml down

echo "✅ Monitoring stopped"
EOF

chmod +x stop-monitoring.sh

# Create log monitoring script
cat > monitor-logs.sh << 'EOF'
#!/bin/bash
# Monitor application logs

echo "📝 Monitoring logs (Press Ctrl+C to stop)..."
echo ""

# Follow logs from all services
docker compose logs -f --tail=100 api frontend nginx
EOF

chmod +x monitor-logs.sh

echo ""
echo "✅ Monitoring setup completed!"
echo ""
echo "Available scripts:"
echo "  ./health-check.sh          - Run health checks"
echo "  ./start-monitoring.sh      - Start Prometheus + Grafana"
echo "  ./stop-monitoring.sh       - Stop monitoring stack"
echo "  ./monitor-logs.sh          - Monitor application logs"
echo ""
echo "To start monitoring:"
echo "  cd /opt/edusphere-pro/monitoring"
echo "  ./start-monitoring.sh"