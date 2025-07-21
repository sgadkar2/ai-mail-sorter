const express = require('express');
const router = express.Router();
const gmailAccountController = require('../controllers/gmailAccount.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.get('/', authenticate, gmailAccountController.getGmailAccounts);
router.post('/add', authenticate, gmailAccountController.addGmailAccount);
router.delete('/:accountId', authenticate, gmailAccountController.removeGmailAccount);
router.post('/refresh-all', authenticate, gmailAccountController.refreshAllTokens);

module.exports = router; 