# 🚀 Hostinger VPS Quick Deployment Guide

**Time Required**: ~30 minutes  
**Difficulty**: Intermediate

---

## ⚡ 5-Minute Quick Start

```bash
# 1. Connect to VPS
ssh root@your-vps-ip

# 2. Install Node.js & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
sudo npm install -g pm2

# 3. Set up project
sudo mkdir -p /var/www/push-notification
cd /var/www/push-notification
git clone YOUR_REPO_URL .

# 4. Configure app
npm install --production
npm run generate-keys

# 5. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 6. Configure Nginx
sudo nano /etc/nginx/sites-available/push-notification
# Copy config from nginx.conf.example
sudo ln -s /etc/nginx/sites-available/push-notification /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 7. Get SSL certificate
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com

# 8. Done! Visit https://yourdomain.com
```

---

## 📋 Pre-Deployment Checklist

- [ ] Hostinger VPS is active
- [ ] Domain DNS pointed to VPS IP
- [ ] SSH access confirmed
- [ ] Code pushed to Git repository

---

## 🔑 Important Commands

### PM2 Management
```bash
pm2 start ecosystem.config.js    # Start app
pm2 restart push-notification     # Restart
pm2 stop push-notification        # Stop
pm2 logs push-notification        # View logs
pm2 monit                         # Monitor
```

### Nginx Management
```bash
sudo nginx -t                     # Test config
sudo systemctl reload nginx       # Reload
sudo systemctl restart nginx      # Restart
sudo tail -f /var/log/nginx/error.log  # View errors
```

### Deployment Updates
```bash
cd /var/www/push-notification
git pull origin main
npm install --production
pm2 restart push-notification
```

### Or use automated script:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔒 After Deployment

1. **Update client URL** in `public/main.js`:
   ```javascript
   const SERVER_ORIGIN = "https://yourdomain.com";
   ```

2. **Test the application**:
   - Visit https://yourdomain.com
   - Subscribe to notifications
   - Send test notification
   - Check PM2 logs

3. **Monitor logs**:
   ```bash
   pm2 logs push-notification --lines 100
   ```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't access site | Check nginx: `sudo systemctl status nginx` |
| App not starting | Check logs: `pm2 logs push-notification` |
| 502 Bad Gateway | App not running: `pm2 restart push-notification` |
| SSL not working | Rerun: `sudo certbot --nginx -d yourdomain.com` |
| Port in use | Check: `sudo lsof -i :3000` |

---

## 📞 Need Help?

See the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide for:
- Detailed step-by-step instructions
- Security hardening
- Production best practices
- Advanced troubleshooting

---

**Quick Links:**
- Full Guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Project README: [README.md](./README.md)
- PM2 Docs: https://pm2.keymetrics.io
- Nginx Docs: https://nginx.org/en/docs/
