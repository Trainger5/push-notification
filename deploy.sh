#!/bin/bash

# Deployment script for Push Notification System
# This script automates the deployment process on VPS

echo "🚀 Starting deployment..."

# Configuration
APP_DIR="/var/www/push-notification"
APP_NAME="push-notification"
BACKUP_DIR="/var/backups/push-notification"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as appropriate user
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. Consider using a non-root user."
fi

# Navigate to app directory
cd $APP_DIR || { print_error "Failed to navigate to $APP_DIR"; exit 1; }

# Create backup
print_warning "Creating backup..."
mkdir -p $BACKUP_DIR
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='logs' \
    . || print_warning "Backup creation failed (non-critical)"
print_success "Backup created: $BACKUP_NAME"

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    print_warning "Pulling latest changes from Git..."
    git pull origin main || { print_error "Git pull failed"; exit 1; }
    print_success "Code updated from Git"
else
    print_warning "Not a git repository. Skipping git pull."
fi

# Install/Update dependencies
print_warning "Installing dependencies..."
npm install --production || { print_error "npm install failed"; exit 1; }
print_success "Dependencies installed"

# Run migrations (if applicable)
# Uncomment if you add database migrations
# print_warning "Running database migrations..."
# npm run migrate || { print_error "Migration failed"; exit 1; }
# print_success "Migrations completed"

# Restart PM2 application
print_warning "Restarting application..."
pm2 restart $APP_NAME || { print_error "PM2 restart failed"; exit 1; }
print_success "Application restarted"

# Save PM2 configuration
pm2 save

# Check application status
sleep 2
pm2 status $APP_NAME

# Cleanup old backups (keep last 5)
print_warning "Cleaning up old backups..."
cd $BACKUP_DIR || exit
ls -t | tail -n +6 | xargs -r rm --
cd - > /dev/null || exit
print_success "Old backups cleaned"

# Check if app is running
if pm2 list | grep -q "$APP_NAME.*online"; then
    print_success "Deployment completed successfully! 🎉"
    echo ""
    echo "App is running at: http://localhost:3000"
    echo "View logs: pm2 logs $APP_NAME"
    echo "Monitor: pm2 monit"
else
    print_error "Application is not running! Check logs with: pm2 logs $APP_NAME"
    exit 1
fi

# Display recent logs
echo ""
print_warning "Recent application logs:"
pm2 logs $APP_NAME --lines 20 --nostream
