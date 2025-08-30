// PM2 Production Configuration
module.exports = {
  apps: [
    {
      name: 'notifypro-api',
      script: './backend/src/server.js',
      cwd: '/var/www/html/push-notification',
      instances: 2, // Use 2 instances for better performance
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        // Add your production environment variables
        JWT_SECRET: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-min-32-chars',
        VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
        VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:admin@yourdomain.com'
      },
      // Logging configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      max_restarts: 10,
      min_uptime: '10s',
      
      // Memory management
      max_memory_restart: '500M',
      
      // Auto-restart on file changes (disable in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log'],
      
      // Advanced PM2 features
      autorestart: true,
      merge_logs: true,
      
      // Health monitoring
      health_check_grace_period: 3000,
      
      // Kill timeout
      kill_timeout: 5000,
    }
  ],
  
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/your-username/push-notification-system.git',
      path: '/var/www/html/push-notification',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};