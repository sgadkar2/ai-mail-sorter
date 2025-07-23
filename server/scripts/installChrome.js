const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('⬇️ Downloading Chromium via Puppeteer...');
    const browserFetcher = puppeteer.createBrowserFetcher();
    const revisionInfo = await browserFetcher.download('1310724'); // or omit to get default
    console.log(`✅ Chromium downloaded to: ${revisionInfo.executablePath}`);
  } catch (err) {
    console.error('❌ Failed to download Chromium:', err.message);
  }
})();
