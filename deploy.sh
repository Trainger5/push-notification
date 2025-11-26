#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Deployment for pushads123.com...${NC}"

# 1. Install Backend Dependencies
echo -e "${BLUE}📦 Installing Backend Dependencies...${NC}"
cd backend
npm install --production

# 2. Install Frontend Dependencies & Build
echo -e "${BLUE}📦 Installing Frontend Dependencies...${NC}"
cd ../frontend
npm install

echo -e "${BLUE}🏗️ Building Frontend...${NC}"
npm run build

# 3. Move Build Artifacts to Backend Public Folder
echo -e "${BLUE}🚚 Moving Frontend Build to Backend...${NC}"
# Ensure backend public directory exists
mkdir -p ../backend/public

# Clear old files
rm -rf ../backend/public/*

# Copy new build files
cp -r dist/* ../backend/public/

# 4. Database Setup (Migrations)
echo -e "${BLUE}🗄️ Running Database Migrations...${NC}"
cd ../backend
npm run setup

# 5. Restart Application
echo -e "${BLUE}🔄 Restarting PM2 Process...${NC}"
cd ..
# Check if process exists
if pm2 list | grep -q "notifypro-api"; then
    pm2 reload notifypro-api
else
    pm2 start ecosystem.config.js --env production
fi
pm2 save

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}🌍 App should be live at https://pushads123.com${NC}"
