#!/bin/bash

# ================================================
# COPY AND PASTE THIS INTO YOUR VPS SSH SESSION
# ================================================

echo "🚀 Habib Furniture - VPS Quick Fix"
echo "=================================="
echo ""
echo "This will fix product add/edit/delete issues"
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."

# Go to app directory
cd /var/www/habib-furniture || {
    echo "❌ Error: /var/www/habib-furniture not found"
    echo "Please run this from your VPS where the app is installed"
    exit 1
}

# Run the fix
sudo bash scripts/fix-vps-deployment.sh
