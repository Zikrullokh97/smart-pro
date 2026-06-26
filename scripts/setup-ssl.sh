#!/bin/bash
# EduSphere Pro - SSL Certificate Setup Script
# Using Let's Encrypt with Certbot

set -e

echo "🔒 Starting SSL certificate setup..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-ssl.sh <domain>"
    echo "Example: ./setup-ssl.sh edusphere.example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}

echo "Domain: $DOMAIN"
echo "Email: $EMAIL"

# Stop nginx temporarily
echo "⏸️ Stopping nginx..."
docker compose stop nginx

# Install certbot if not installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt install -y certbot python3-certbot-nginx
fi

# Obtain certificate
echo "📜 Obtaining SSL certificate from Let's Encrypt..."
certbot certonly --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d api.$DOMAIN

# Create directory for SSL certificates in nginx
echo "📁 Creating SSL certificate directory..."
mkdir -p nginx/ssl
chmod 700 nginx/ssl

# Copy certificates
echo "📋 Copying certificates..."
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem

# Update nginx.conf with domain
echo "⚙️ Updating nginx configuration..."
sed -i "s/your-domain.com/$DOMAIN/g" nginx/nginx.conf

# Uncomment HTTPS server block
echo "🔓 Enabling HTTPS server block..."
sed -i 's/# server {/server {/g' nginx/nginx.conf
sed -i 's/#     listen 443/    listen 443/g' nginx/nginx.conf
sed -i 's/#     ssl_certificate/    ssl_certificate/g' nginx/nginx.conf
sed -i 's/#     ssl_certificate_key/    ssl_certificate_key/g' nginx/nginx.conf
sed -i 's/#     ssl_protocols/    ssl_protocols/g' nginx/nginx.conf
sed -i 's/#     ssl_ciphers/    ssl_ciphers/g' nginx/nginx.conf
sed -i 's/#     ssl_prefer_server_ciphers/    ssl_prefer_server_ciphers/g' nginx/nginx.conf

# Setup auto-renewal
echo "🔄 Setting up automatic certificate renewal..."
cat > /etc/cron.d/certbot-renew << EOF
0 0 * * * root certbot renew --quiet --post-hook "cd /opt/edusphere-pro && ./scripts/reload-ssl.sh"
EOF

chmod 644 /etc/cron.d/certbot-renew

# Create reload script
cat > scripts/reload-ssl.sh << 'RELOADEOF'
#!/bin/bash
# Reload SSL certificates

echo "🔄 Reloading SSL certificates..."

# Copy new certificates
DOMAIN=$(grep "server_name" nginx/nginx.conf | head -1 | awk '{print $2}' | tr -d ';')
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem

# Reload nginx
docker compose exec nginx nginx -s reload

echo "✅ SSL certificates reloaded"
RELOADEOF

chmod +x scripts/reload-ssl.sh

# Start nginx
echo "▶️ Starting nginx..."
docker compose up -d nginx

echo ""
echo "✅ SSL setup completed!"
echo ""
echo "Your site is now available at:"
echo "  https://$DOMAIN"
echo "  https://www.$DOMAIN"
echo "  https://api.$DOMAIN"
echo ""
echo "Certificate will auto-renew. Test renewal with:"
echo "  certbot renew --dry-run"
echo ""
echo "To renew manually:"
echo "  ./scripts/reload-ssl.sh"