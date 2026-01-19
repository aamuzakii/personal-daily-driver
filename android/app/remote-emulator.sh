
adb kill-server
adb start-server
adb devices



adb tcpip 5555
adb connect <phone-ip>:5555

#!/usr/bin/env bash

set -e

echo "Restarting ADB..."
adb kill-server
adb start-server

echo "Switching phone to TCP mode..."
adb tcpip 5555
sleep 2

PHONE_IP=$(adb shell ip route | awk '/wlan0/ {print $9}')

if [ -z "$PHONE_IP" ]; then
  echo "Could not detect phone IP"
  exit 1
fi

echo "Phone IP: $PHONE_IP"
adb connect $PHONE_IP:5555

echo "Done. You can unplug USB now."
adb devices
