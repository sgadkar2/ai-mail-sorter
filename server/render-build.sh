#!/usr/bin/env bash

# Install Google Chrome for Puppeteer
echo "🔧 Installing Google Chrome..."
apt-get update
apt-get install -y wget gnupg ca-certificates

wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
apt-get update
apt-get install -y google-chrome-stable

echo "✅ Google Chrome installed at: $(which google-chrome-stable)"

# Proceed with your normal build steps
echo "📦 Installing Node dependencies..."
npm install
