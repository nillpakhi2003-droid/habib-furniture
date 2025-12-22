#!/bin/bash

# ============================================
# Test Backup Script
# (Sends a test message to Telegram)
# ============================================

echo "📧 Testing Telegram backup configuration..."

# Load environment
export $(cat .env | grep -v '^#' | xargs)

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ TELEGRAM_BOT_TOKEN not set in .env"
    exit 1
fi

if [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "❌ TELEGRAM_CHAT_ID not set in .env"
    exit 1
fi

# Send test message
MESSAGE="🧪 *Test Message*

This is a test from Habib Furniture backup system.

If you receive this message, your Telegram backup is configured correctly!

⏰ $(date '+%Y-%m-%d %H:%M:%S %Z')"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\":\"${TELEGRAM_CHAT_ID}\",\"text\":\"${MESSAGE}\",\"parse_mode\":\"Markdown\"}" \
    > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Test message sent successfully!"
    echo "Check your Telegram channel/group"
else
    echo "❌ Failed to send test message"
    echo "Please check your TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID"
    exit 1
fi
