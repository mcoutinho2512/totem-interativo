#!/bin/bash
# ============================================
# Sanaris City Totem - Stop Kiosk Mode
# ============================================

echo "Stopping kiosk mode..."

# Kill Chromium
pkill -f chromium-kiosk 2>/dev/null
pkill -f "chromium.*kiosk" 2>/dev/null
pkill -f "chrome.*kiosk" 2>/dev/null

# Kill unclutter
pkill unclutter 2>/dev/null

# Restore screen settings
if command -v xset &> /dev/null; then
    xset s on 2>/dev/null
    xset +dpms 2>/dev/null
fi

echo "Kiosk mode stopped."
