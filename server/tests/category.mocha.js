require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const createApp = require('../app');

describe('Category API', function() {
  let mongoServer, app, User, Category, user, token;

  // Increase timeout for MongoDB startup
  this.timeout(10000);

  before(async function() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    global.__MONGO_CONN__ = mongoose.connection;
    User = mongoose.model('User', require('../models/User').schema);
    Category = mongoose.model('Category', require('../models/Category').schema);
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
    await Category.deleteMany({});
  });

  it('should create a new category', async function() {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Work', description: 'Work emails' });
    expect(res.status).to.equal(201);
    expect(res.body.name).to.equal('work'); // if you normalize to lowercase
    expect(res.body.description).to.equal('Work emails');
  });

  it('should fetch categories for the user', async function() {
    await Category.create({ name: 'personal', description: 'Personal emails', user: user._id });
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.length).to.be.greaterThan(0);
    expect(res.body[0].name).to.equal('personal');
  });
});