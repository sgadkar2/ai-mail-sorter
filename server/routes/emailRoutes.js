// routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const { 
  deleteEmails, 
  getEmailsByCategory, 
  getEmailById, 
  bulkUnsubscribe,
  getEmailsSummary 
} = require('../controllers/emailController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get emails by category
router.get('/category/:categoryId', getEmailsByCategory);

// Get single email by ID
router.get('/:emailId', getEmailById);

// Get emails summary (counts by category)
router.get('/summary', getEmailsSummary);

// Bulk delete emails
router.delete('/', deleteEmails);

// Bulk unsubscribe from emails
router.post('/unsubscribe', bulkUnsubscribe);

module.exports = router;
