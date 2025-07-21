const { google } = require('googleapis');
const GmailAccount = require('../models/GmailAccount');
const oauth2Client = require('../config/googleOAuth');

const SCOPES = [
  'https://mail.google.com/',
  'openid', 'email', 'profile',
];

// Get all Gmail accounts for a user
exports.getGmailAccounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const accounts = await GmailAccount.find({ user: userId }).select('-accessToken -refreshToken');
    
    res.json(accounts);
  } catch (error) {
    console.error('❌ Error fetching Gmail accounts:', error);
    res.status(500).json({ error: 'Failed to fetch Gmail accounts' });
  }
};

// Initiate OAuth for additional Gmail account
exports.addGmailAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Generate state parameter to identify this specific OAuth flow
    const state = Buffer.from(JSON.stringify({ userId, action: 'addAccount' })).toString('base64');
    
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state: state,
      // Don't override redirect_uri - use the one configured in Google Cloud Console
    });
    
    //console.log('🔗 Generated OAuth URL for add account with state:', state);
    
    res.json({ authUrl: url });
  } catch (error) {
    console.error('❌ Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
};

// Remove a Gmail account
exports.removeGmailAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user._id;

    const account = await GmailAccount.findOne({ _id: accountId, user: userId });
    
    if (!account) {
      return res.status(404).json({ error: 'Gmail account not found' });
    }

    await GmailAccount.findByIdAndDelete(accountId);
    
    res.json({ message: 'Gmail account removed successfully' });
  } catch (error) {
    console.error('❌ Error removing Gmail account:', error);
    res.status(500).json({ error: 'Failed to remove Gmail account' });
  }
};

// Refresh tokens for all accounts (utility function)
exports.refreshAllTokens = async (req, res) => {
  try {
    const userId = req.user._id;
    const accounts = await GmailAccount.find({ user: userId });

    const results = [];
    
    for (const account of accounts) {
      try {
        oauth2Client.setCredentials({
          refresh_token: account.refreshToken,
        });

        const { token: accessToken } = await oauth2Client.getAccessToken();
        
        if (accessToken) {
          account.accessToken = accessToken;
          await account.save();
          results.push({ email: account.email, status: 'refreshed' });
        } else {
          results.push({ email: account.email, status: 'failed', error: 'No access token received' });
        }
      } catch (error) {
        results.push({ email: account.email, status: 'failed', error: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('❌ Error refreshing tokens:', error);
    res.status(500).json({ error: 'Failed to refresh tokens' });
  }
}; 