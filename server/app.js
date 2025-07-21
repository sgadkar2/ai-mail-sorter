// app.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());

  // Example test route
  if (process.env.NODE_ENV === 'test') {
    app.get('/api/test-users', async (req, res) => {
      const users = await mongoose.model('User').find();
      console.log('Users in test route:', users);
      res.json(users);
    });
  }

  // Routes
  app.use('/api/auth', require('./routes/auth.routes'));
  app.use('/api/categories', require('./routes/category.routes'));
  app.use('/api/emails', require('./routes/emailRoutes'));
  app.use('/api/gmail-accounts', require('./routes/gmailAccount.routes'));

  return app;
}

module.exports = createApp;