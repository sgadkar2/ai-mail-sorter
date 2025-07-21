// index.js
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express'); 
const app = require('./app');
const path = require('path');

const PORT = process.env.PORT || 5173;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Serve static files from React build
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }
  
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