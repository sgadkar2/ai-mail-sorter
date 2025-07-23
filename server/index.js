// index.js
require('dotenv').config();
const mongoose = require('mongoose');
const createApp = require('./app');
const path = require('path');

const PORT = process.env.PORT || 5173;

const fs = require('fs');


const puppeteer = require('puppeteer-core');

async function verifyPuppeteer() {
  try {
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://example.com');
    await browser.close();
    console.log('✅ Puppeteer Chrome verified and working');
  } catch (err) {
    console.error('❌ Puppeteer verification failed:', err.message);
    console.log('💡 This might affect unsubscribe functionality, but server will continue');
  }
}





mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  // Verify Puppeteer installation
  await verifyPuppeteer();
  
  const app = createApp();

  // --- Static file serving block removed for Render deployment ---
  // If you ever want to serve frontend from backend, uncomment below:
  // if (process.env.NODE_ENV === 'production') {
  //   app.use(require('express').static(path.join(__dirname, '../client/dist')));
  //   app.get('*', (req, res) => {
  //     res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  //   });
  // }

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
.catch((err) => console.error('❌ MongoDB connection error:', err));

const cron = require('node-cron');
const pollGmail = require('./services/pollGmail');

// Run every 5 minutes in production
const cronSchedule = process.env.NODE_ENV === 'production' ? '*/5 * * * *' : '*/2 * * * *';
cron.schedule(cronSchedule, async () => {
  console.log('⏰ Polling Gmail...');
  await pollGmail();
});