require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const chai = require('chai');
const expect = chai.expect;
const proxyquire = require('proxyquire');

describe('AI Services', function() {
  let mongoServer, User, Category, user, category, generateSummary, categorizeEmail;

  this.timeout(10000);

  before(async function() {
    // Mock OpenAI client
    const mockOpenAI = function() {
      return {
        chat: {
          completions: {
            create: async (opts) => {
              if (opts.messages[0].content.includes('decide the most appropriate category')) {
                return { choices: [{ message: { content: 'work' } }] };
              } else {
                return { choices: [{ message: { content: 'This is a summary.' } }] };
              }
            }
          }
        }
      };
    };

    // Use proxyquire to inject the mock into your services
    generateSummary = proxyquire('../services/generateSummary', {
      openai: mockOpenAI
    });
    categorizeEmail = proxyquire('../services/categorizeEmail', {
      openai: mockOpenAI,
      '../models/Category': require('../models/Category')
    });

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    global.__MONGO_CONN__ = mongoose.connection;
    User = mongoose.model('User', require('../models/User').schema);
    Category = mongoose.model('Category', require('../models/Category').schema);
    user = await User.create({ email: 'ai@example.com', name: 'AI User' });
    category = await Category.create({ name: 'work', description: 'Work stuff', user: user._id });
  });

  after(async function() {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async function() {
    await Category.deleteMany({});
    category = await Category.create({ name: 'work', description: 'Work stuff', user: user._id });
  });

  it('should categorize an email using AI', async function() {
    const categoryId = await categorizeEmail({
      subject: 'Project Update',
      body: 'Here is the latest on the project...',
      userId: user._id.toString()
    });
    console.log('Expected category ID:', category._id.toString());
    console.log('Returned category ID:', categoryId.toString());
    expect(categoryId.toString()).to.equal(category._id.toString());
  });

  it('should generate a summary for an email', async function() {
    const summary = await generateSummary('Project Update', 'Here is the latest on the project...');
    expect(summary).to.be.a('string');
    expect(summary.length).to.be.greaterThan(0);
    expect(summary).to.equal('This is a summary.');
  });
});