// index.js
require('dotenv').config();
const mongoose = require('mongoose');
const createApp = require('./app');
const path = require('path');

const PORT = process.env.PORT || 5173;

const fs = require('fs');
require('./scripts/installChrome');


// Verify Puppeteer installation on startup
async function verifyPuppeteer() {
  try {
    const puppeteer = require('puppeteer');
    console.log('🔍 Verifying Puppeteer installation...');

    const executablePath = puppeteer.executablePath();
    console.log(`📍 Using Chrome executable path: ${executablePath}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath
    });

    await browser.close();
    console.log('✅ Puppeteer Chrome installation verified successfully');
  } catch (error) {
    console.error('❌ Puppeteer verification failed:', error.message);
    console.log('💡 This might affect unsubscribe functionality, but the server will continue running');
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