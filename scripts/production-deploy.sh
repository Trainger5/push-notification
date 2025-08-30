#!/bin/bash

# Production Deployment Script for NotifyPro
# Run this on your Ubuntu server at /var/www/html/push-notification

echo "🚀 Starting NotifyPro Production Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as correct user
if [ "$USER" != "ubuntu" ] && [ "$USER" != "root" ]; then
    print_warning "Running as user: $USER. Recommended to run as ubuntu or root."
fi

# Create logs directory
mkdir -p logs
print_status "Created logs directory"

# Install dependencies for backend
cd backend
print_info "Installing backend dependencies..."
npm ci --only=production
print_status "Backend dependencies installed"

# Build frontend if needed
cd ../frontend
if [ -d "dist" ]; then
    print_info "Frontend build directory exists"
else
    print_info "Building frontend for production..."
    npm ci
    npm run build
    print_status "Frontend built successfully"
fi

# Go back to project root
cd ..

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing PM2 globally..."
    npm install -g pm2
    print_status "PM2 installed globally"
fi

# Stop existing processes
print_info "Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start with ecosystem config
print_info "Starting NotifyPro with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
print_status "PM2 configuration saved"

# Setup PM2 startup script
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true
print_status "PM2 startup script configured"

# Show PM2 status
print_info "Current PM2 status:"
pm2 status

# Show PM2 logs
print_info "Recent logs:"
pm2 logs --lines 10

print_status "🎉 NotifyPro deployment completed!"
print_info "Backend running on: http://localhost:4000"
print_info "Frontend served from: /var/www/html/push-notification/frontend/dist"

echo ""
echo "📋 Next Steps:"
echo "1. Configure nginx to serve frontend and proxy API"
echo "2. Setup SSL certificate"
echo "3. Configure domain DNS"
echo "4. Monitor with: pm2 monit"
echo "5. View logs with: pm2 logs"

echo ""
echo "🔧 Useful PM2 Commands:"
echo "pm2 status          - Show process status"
echo "pm2 restart all     - Restart all processes"
echo "pm2 reload all      - Zero-downtime reload"
echo "pm2 logs            - View logs"
echo "pm2 monit           - Monitor processes"