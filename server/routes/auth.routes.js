//auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/google', authController.initiateGoogleOAuth);
router.get('/callback', authController.handleOAuthCallback);

module.exports = router;
