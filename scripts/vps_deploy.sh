#!/bin/bash

# ==============================================================================
# S-NETWORK PRODUCTION DEPLOYMENT SCRIPT
# ==============================================================================

# EXIT ON ERROR
set -e

# USER CONFIGURATION (REQUIRED)
# -----------------------------
DOMAIN="yourdomain.com" # <--- REPLACE WITH YOUR ACTUAL DOMAIN
GITHUB_REPO="https://github.com/SemmsSolutions/S-Network.git"

# 1. SYSTEM UPDATES & DEPENDENCIES
# -----------------------------
echo "Updating system and installing dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. CLONE REPOSITORY
# -----------------------------
echo "Cloning repository..."
rm -rf S-Network # Clean start
git clone $GITHUB_REPO
cd S-Network

# 3. ENVIRONMENT SETUP
# -----------------------------
echo "Setting up environment variables..."
cat <<EOF > .env
DATABASE_URL="postgresql://postgres.exqvpzijavrbpfzqixnk:semms%40snetwor@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
SUPABASE_URL=https://exqvpzijavrbpfzqixnk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cXZwemlqYXZyYnBmenFpeG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTE5NzAsImV4cCI6MjA5MTU2Nzk3MH0.LQ1aZwesA5q7njMZ__zSSpaOmXV06TrAisVcP2PQ_9I
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cXZwemlqYXZyYnBmenFpeG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk5MTk3MCwiZXhwIjoyMDkxNTY3OTcwfQ.4g22KWbZ9ZELLAbyCP6zX9HCTHFwzNXpcTOQ1CjKI-8
EOF

# 4. BUILD WEB APPLICATION
# -----------------------------
echo "Building Angular web application..."
cd build-connect-web
npm install
npm run build

# 5. CONFIGURE NGINX
# -----------------------------
echo "Configuring Nginx..."
sudo mkdir -p /var/www/s-network
sudo cp -r dist/build-connect-web/browser/* /var/www/s-network/
sudo chown -R www-data:www-data /var/www/s-network
sudo chmod -R 755 /var/www/s-network

cat <<EOF | sudo tee /etc/nginx/sites-available/s-network
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root /var/www/s-network;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "no-referrer-when-downgrade";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.google.com;";
}
EOF

# Enable Site
sudo ln -sf /etc/nginx/sites-available/s-network /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# 6. SSL SETUP (CERTBOT)
# -----------------------------
echo "Setting up SSL..."
# This command will prompt for email and agreement during first run
# For fully automated, you could add: --email admin@$DOMAIN --agree-tos --no-eff-email
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN

echo "Deployment completed successfully!"
echo "Your app is now live at https://$DOMAIN"
