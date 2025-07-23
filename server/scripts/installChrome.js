// scripts/installChrome.js
const { execSync } = require('child_process');

try {
  console.log('📦 Installing Puppeteer Chrome...');
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
  console.log('✅ Puppeteer Chrome installed');
} catch (err) {
  console.error('❌ Failed to install Puppeteer Chrome', err);
  process.exit(1);
}
