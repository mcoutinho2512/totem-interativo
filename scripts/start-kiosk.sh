#!/bin/bash
# ============================================
# Sanaris City Totem - Kiosk Mode Launcher
# ============================================
# This script starts Chromium in kiosk mode for digital signage
# Usage: ./start-kiosk.sh [URL]

# Default URL - can be overridden by passing argument
TOTEM_URL="${1:-http://localhost:3000/player}"

# Configuration
DISPLAY_NUM="${DISPLAY:-:0}"
CHROMIUM_BIN=""

# Find Chromium binary
for bin in chromium-browser chromium google-chrome google-chrome-stable; do
    if command -v $bin &> /dev/null; then
        CHROMIUM_BIN=$bin
        break
    fi
done

if [ -z "$CHROMIUM_BIN" ]; then
    echo "Error: No Chromium or Chrome browser found!"
    echo "Please install chromium-browser or google-chrome"
    exit 1
fi

echo "============================================"
echo "Sanaris City Totem - Kiosk Mode"
echo "============================================"
echo "Browser: $CHROMIUM_BIN"
echo "URL: $TOTEM_URL"
echo "Display: $DISPLAY_NUM"
echo "============================================"

# Kill any existing Chromium instances
pkill -f chromium 2>/dev/null
pkill -f chrome 2>/dev/null

# Wait a moment
sleep 2

# Disable screen blanking and power management
if command -v xset &> /dev/null; then
    xset -display $DISPLAY_NUM s off 2>/dev/null
    xset -display $DISPLAY_NUM -dpms 2>/dev/null
    xset -display $DISPLAY_NUM s noblank 2>/dev/null
fi

# Hide cursor (optional - requires unclutter)
if command -v unclutter &> /dev/null; then
    pkill unclutter 2>/dev/null
    unclutter -idle 0.5 -root &
fi

# Clear Chromium cache and crash data
CHROMIUM_DATA_DIR="$HOME/.config/chromium-kiosk"
rm -rf "$CHROMIUM_DATA_DIR/Singleton*" 2>/dev/null
rm -rf "$CHROMIUM_DATA_DIR/Crash Reports" 2>/dev/null

# Launch Chromium in kiosk mode
export DISPLAY=$DISPLAY_NUM

$CHROMIUM_BIN \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --disable-session-crashed-bubble \
    --disable-restore-session-state \
    --start-fullscreen \
    --incognito \
    --disable-translate \
    --disable-features=TranslateUI \
    --disable-extensions \
    --disable-component-update \
    --disable-background-networking \
    --disable-sync \
    --disable-default-apps \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --disable-gesture-typing \
    --no-first-run \
    --fast \
    --fast-start \
    --disable-popup-blocking \
    --disable-prompt-on-repost \
    --check-for-update-interval=31536000 \
    --disable-hang-monitor \
    --disable-client-side-phishing-detection \
    --user-data-dir="$CHROMIUM_DATA_DIR" \
    --window-size=1920,1080 \
    --window-position=0,0 \
    "$TOTEM_URL" &

CHROMIUM_PID=$!
echo "Chromium started with PID: $CHROMIUM_PID"

# Monitor and restart if crashed
while true; do
    if ! ps -p $CHROMIUM_PID > /dev/null 2>&1; then
        echo "Chromium crashed or closed. Restarting in 5 seconds..."
        sleep 5

        $CHROMIUM_BIN \
            --kiosk \
            --noerrdialogs \
            --disable-infobars \
            --disable-session-crashed-bubble \
            --start-fullscreen \
            --incognito \
            --no-first-run \
            --user-data-dir="$CHROMIUM_DATA_DIR" \
            "$TOTEM_URL" &

        CHROMIUM_PID=$!
        echo "Chromium restarted with PID: $CHROMIUM_PID"
    fi
    sleep 30
done
