const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🔍 Fetching default Puppeteer Chromium path...');
    const path = puppeteer.executablePath();
    console.log(`✅ Puppeteer Chromium executable path: ${path}`);
  } catch (err) {
    console.error('❌ Could not fetch Chromium path:', err.message);
  }
})();
