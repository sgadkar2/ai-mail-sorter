require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const createApp = require('../app');

describe('Auth Middleware', function() {
  let mongoServer, app, User;

  this.timeout(10000);

  before(async function() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    global.__MONGO_CONN__ = mongoose.connection;
    User = mongoose.model('User', require('../models/User').schema);
    app = createApp();
  });

  after(async function() {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async function() {
    await User.deleteMany({});
  });

  it('should reject unauthenticated requests', async function() {
    const res = await request(app).get('/api/categories');
    expect(res.status).to.equal(401);
  });
});