#!/bin/bash
# EduSphere Pro - Production Server Setup Script
# For Ubuntu 24.04 LTS

set -e

echo "🚀 Starting EduSphere Pro server setup..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt install -y \
    git \
    curl \
    wget \
    ufw \
    fail2ban \
    htop \
    nano \
    certbot \
    python3-certbot-nginx

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
echo "🐳 Installing Docker Compose..."
apt install -y docker-compose-plugin

# Add current user to docker group
usermod -aG docker $USER

# Configure UFW Firewall
echo "🔥 Configuring UFW firewall..."
ufw --force disable
ufw --force reset

# Allow SSH
ufw allow 22/tcp comment 'SSH'

# Allow HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Deny everything else
ufw default deny incoming
ufw default allow outgoing

# Enable UFW
echo "y" | ufw enable

# Configure fail2ban
echo "🛡️ Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

systemctl restart fail2ban
systemctl enable fail2ban

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /opt/edusphere-pro
mkdir -p /backup/postgres
chown -R $USER:$USER /opt/edusphere-pro
chown -R $USER:$USER /backup/postgres

# Configure log rotation for Docker
echo "📝 Configuring Docker log rotation..."
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker

# Setup automatic security updates
echo "🔒 Configuring automatic security updates..."
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo "✅ Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Reboot the server: sudo reboot"
echo "2. Clone your repository to /opt/edusphere-pro"
echo "3. Configure .env file"
echo "4. Run: docker compose up -d"
echo ""
echo "Firewall status:"
ufw status