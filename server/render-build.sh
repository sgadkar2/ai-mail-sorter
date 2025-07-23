#!/usr/bin/env bash

echo "📦 Installing Node dependencies..."
npm install

echo "⬇️ Installing Puppeteer Chromium..."
npx puppeteer browsers install chrome
