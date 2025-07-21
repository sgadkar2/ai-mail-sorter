// tests/minimal.mocha.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
console.log('ENCRYPTION_KEY in test:', process.env.ENCRYPTION_KEY);
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const createApp = require('../app');


describe('Minimal User Test (Mocha)', function() {
  let mongoServer, app, User, user;

  before(async function() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
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

  it('should find the user in the test code', async function() {
    user = await User.create({ email: 'minimal@example.com', name: 'Minimal User' });
    const found = await User.findById(user._id);
    expect(found).to.not.be.null;
    expect(found.email).to.equal('minimal@example.com');
  });

  it('should find the user via the API route', async function() {
    user = await User.create({ email: 'minimal@example.com', name: 'Minimal User' });
    const res = await request(app).get('/api/test-users');
    console.log('res.body:', res.body);
    console.log('res.text:', res.text);
    console.log('res.headers:', res.headers);
    expect(res.body.length).to.be.greaterThan(0);
    expect(res.body.some(u => u.email === 'minimal@example.com')).to.be.true;
  });
});