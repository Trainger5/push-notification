# 🐧 Ubuntu Production Deployment Guide

## Quick Setup Commands

### 1. Upload Files to Server
```bash
# On your local machine
scp -r . ubuntu@your-server-ip:/var/www/html/push-notification/
```

### 2. Run Production Deploy Script
```bash
# On Ubuntu server
cd /var/www/html/push-notification
chmod +x scripts/production-deploy.sh
./scripts/production-deploy.sh
```

### 3. Configure Nginx
```bash
# Install nginx if not already installed
sudo apt update
sudo apt install nginx -y

# Copy nginx config
sudo cp config/nginx.conf /etc/nginx/sites-available/notifypro

# Enable the site
sudo ln -s /etc/nginx/sites-available/notifypro /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

### 4. Setup SSL with Let's Encrypt (Optional)
```bash
# Install certbot
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## 🔍 Verify Deployment

### Run Health Check
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

### Manual Checks
```bash
# Check PM2 status
pm2 status
pm2 logs

# Check nginx status
sudo systemctl status nginx

# Test API endpoint
curl http://localhost:4000/health

# Test frontend (if domain configured)
curl http://yourdomain.com
```

## 📊 Monitor Production

### PM2 Commands
```bash
pm2 monit              # Real-time monitoring
pm2 logs               # View logs
pm2 restart all        # Restart processes
pm2 reload all         # Zero-downtime reload
pm2 save               # Save current processes
pm2 startup            # Auto-start on boot
```

### System Monitoring
```bash
# Check system resources
htop
df -h
free -h

# Check network connections
netstat -tlnp | grep :4000
netstat -tlnp | grep :80
```

## 🚨 Troubleshooting

### Common Issues

**PM2 Process Not Starting:**
```bash
pm2 logs  # Check error logs
cd /var/www/html/push-notification/backend
npm install  # Reinstall dependencies
```

**Nginx 502 Bad Gateway:**
```bash
sudo nginx -t  # Test config
systemctl status nginx
pm2 status  # Ensure backend is running
```

**Database Issues:**
```bash
# Check if database files exist
ls -la backend/data/
# Ensure proper permissions
sudo chown -R ubuntu:ubuntu /var/www/html/push-notification/
```

**Port Already in Use:**
```bash
sudo netstat -tlnp | grep :4000
sudo kill -9 <PID>  # Kill process using port
pm2 restart all
```

## 🔧 Production Configuration Files

### Environment Variables (.env)
```bash
NODE_ENV=production
PORT=4000
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### PM2 Ecosystem (ecosystem.config.js)
Already configured for:
- ✅ Cluster mode with 2 instances
- ✅ Auto-restart on failure
- ✅ Memory limit (500MB)
- ✅ Log rotation
- ✅ Production environment variables

## 🎯 Final Checklist

- [ ] Files uploaded to `/var/www/html/push-notification/`
- [ ] Production deploy script executed
- [ ] PM2 processes running (check with `pm2 status`)
- [ ] Nginx configured and running
- [ ] Domain DNS pointing to server IP
- [ ] SSL certificate configured (optional)
- [ ] Health check script passes
- [ ] Frontend accessible via domain
- [ ] API endpoints responding
- [ ] Admin dashboard functional

## 🎉 Success!

Your NotifyPro system is now running in production on Ubuntu with:
- ✅ **Zero-downtime deployment** with PM2 cluster mode
- ✅ **High availability** with auto-restart
- ✅ **Performance monitoring** with PM2 monit
- ✅ **Production logging** with log rotation
- ✅ **Web server integration** with Nginx
- ✅ **Health monitoring** with automated checks

### Access Your Application:
- **Frontend**: http://yourdomain.com (or server IP)
- **API**: http://yourdomain.com/api (or server IP:4000)
- **Admin**: http://yourdomain.com/admin
- **Monitoring**: `pm2 monit` on server

**Your NotifyPro push notification system is live! 🚀**