#!/bin/bash

# Fix permissions for uploads directory
echo "🔧 Fixing permissions for uploads directory..."

# Ensure directory exists
mkdir -p public/uploads

# Set directory permissions to 755 (rwxr-xr-x)
# Owner: rwx, Group: rx, Others: rx
chmod -R 755 public/uploads

echo "✅ Permissions fixed. 'public/uploads' is now readable by Nginx."
ls -ld public/uploads
