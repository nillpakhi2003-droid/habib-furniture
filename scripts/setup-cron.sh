#!/bin/bash

# ================================================
# Cron Job Setup Script
# Daily Database Backup at 2 AM Bangladesh Time
# ================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$(dirname "$SCRIPT_DIR")"

echo "🕐 Setting up daily backup cron job..."

# Create log directory
sudo mkdir -p /var/log/habib-furniture
sudo chown $USER:$USER /var/log/habib-furniture

# Create cron job
CRON_JOB="0 2 * * * cd $APP_DIR && npm run backup >> /var/log/habib-furniture/backup.log 2>&1"

# Check if cron job already exists
crontab -l 2>/dev/null | grep -q "npm run backup"

if [ $? -eq 0 ]; then
    echo "⚠️  Backup cron job already exists"
    echo "Current crontab:"
    crontab -l | grep "backup"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Backup cron job added successfully"
fi

echo ""
echo "📅 Backup Schedule:"
echo "   Runs daily at 2:00 AM Bangladesh Time"
echo "   Logs: /var/log/habib-furniture/backup.log"
echo ""
echo "View current crontab:"
echo "   crontab -l"
echo ""
echo "View backup logs:"
echo "   tail -f /var/log/habib-furniture/backup.log"
echo ""
echo "Test backup manually:"
echo "   npm run backup"
