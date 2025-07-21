require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const createApp = require('../app');

describe('Gmail Account API', function() {
  let mongoServer, app, User, GmailAccount, user, token;

  this.timeout(10000);

  before(async function() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    global.__MONGO_CONN__ = mongoose.connection;
    User = mongoose.model('User', require('../models/User').schema);
    GmailAccount = mongoose.model('GmailAccount', require('../models/GmailAccount').schema);
    app = createApp();
    user = await User.create({ email: 'test@example.com', name: 'Test User' });
    const jwt = require('jsonwebtoken');
    token = jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  after(async function() {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async function() {
    await GmailAccount.deleteMany({});
  });

  it('should add a Gmail account (mocked)', async function() {
    // You may need to mock the OAuth flow or test the DB directly
    const account = await GmailAccount.create({
      user: user._id,
      email: 'test@gmail.com',
      accessToken: 'fake',
      refreshToken: 'fake',
    });
    expect(account.email).to.equal('test@gmail.com');
  });

  it('should remove a Gmail account', async function() {
    const account = await GmailAccount.create({
      user: user._id,
      email: 'test@gmail.com',
      accessToken: 'fake',
      refreshToken: 'fake',
    });
    await request(app)
      .delete(`/api/gmail-accounts/${account._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const found = await GmailAccount.findById(account._id);
    expect(found).to.be.null;
  });
});