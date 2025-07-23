// tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  // Register models globally
  try {
    global.User = mongoose.model('User');
  } catch (e) {
    global.User = mongoose.model('User', require('../models/User').schema);
  }
  try {
    global.Category = mongoose.model('Category');
  } catch (e) {
    global.Category = mongoose.model('Category', require('../models/Category').schema);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
 
});