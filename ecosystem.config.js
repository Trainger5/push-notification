module.exports = {
    apps: [{
        name: 'push-notification',
        script: './server.js',
        instances: 1,
        exec_mode: 'fork',

        // Environment variables
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },

        // Logging
        error_file: './logs/error.log',
        out_file: './logs/output.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Auto-restart configuration
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',

        // Restart delay
        restart_delay: 4000,

        // Advanced settings
        min_uptime: '10s',
        max_restarts: 10,

        // Source map support
        source_map_support: true,

        // Ignore watch files
        ignore_watch: [
            'node_modules',
            'logs',
            'subscriptions.json',
            '.git'
        ],

        // Time to wait before sending final SIGKILL
        kill_timeout: 5000,

        // Listen timeout
        listen_timeout: 3000
    }]
};
