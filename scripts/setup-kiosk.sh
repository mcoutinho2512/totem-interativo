#!/bin/bash
# ============================================
# Sanaris City Totem - Kiosk Setup Script
# ============================================
# Run this script to set up the kiosk environment
# Requires sudo privileges

echo "============================================"
echo "Sanaris City Totem - Kiosk Setup"
echo "============================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./setup-kiosk.sh)"
    exit 1
fi

# Detect package manager
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt-get"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
else
    echo "Unknown package manager. Please install dependencies manually."
    exit 1
fi

echo "Using package manager: $PKG_MANAGER"

# Install required packages
echo ""
echo "Installing required packages..."
$PKG_MANAGER update -y
$PKG_MANAGER install -y \
    chromium-browser \
    unclutter \
    xdotool \
    x11-xserver-utils

# Create systemd service for auto-start
echo ""
echo "Creating systemd service..."

cat > /etc/systemd/system/sanaris-kiosk.service << 'EOF'
[Unit]
Description=Sanaris City Totem Kiosk
After=graphical.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=totem
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/totem/.Xauthority
ExecStart=/opt/sanaris-city-totem/scripts/start-kiosk.sh http://localhost:3000/player
Restart=on-failure
RestartSec=10

[Install]
WantedBy=graphical.target
EOF

# Reload systemd
systemctl daemon-reload

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "To start the kiosk manually:"
echo "  ./start-kiosk.sh"
echo ""
echo "To enable auto-start on boot:"
echo "  sudo systemctl enable sanaris-kiosk"
echo "  sudo systemctl start sanaris-kiosk"
echo ""
echo "To check status:"
echo "  sudo systemctl status sanaris-kiosk"
echo ""
echo "Note: Make sure to create a 'totem' user if using systemd service,"
echo "or modify the User= line in the service file."
echo ""
