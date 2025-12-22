#!/bin/bash

# ================================================
# PM2 Ecosystem Configuration
# For Ubuntu VPS Production
# ================================================

# This file is used by PM2 to manage the application

module.exports = {
  apps: [{
    name: 'habib-furniture',
    script: 'npm',
    args: 'start',
    instances: 1,
    exec_mode: 'cluster',
    
    // Auto restart
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 10000
    },
    
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Restart delay
    restart_delay: 4000,
    
    // Max restarts within time frame
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
