const oauth2Client = require('../config/googleOAuth');
const { google } = require('googleapis');
const GmailAccount = require('../models/GmailAccount');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const SCOPES = [
  'https://mail.google.com/',
  'openid', 'email', 'profile',
];

exports.initiateGoogleOAuth = async (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
  res.redirect(url);
};

exports.handleOAuthCallback = async (req, res) => {
  const { code, state } = req.query;
  
  console.log(' OAuth callback hit - code:', !!code, 'state:', !!state);

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get basic profile
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Get Gmail profile to fetch historyId
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const gmailProfile = await gmail.users.getProfile({ userId: 'me' });
    const historyId = gmailProfile.data.historyId;

    // Check if this is an "add account" flow
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        
        if (stateData.action === 'addAccount' && stateData.userId) {
          console.log('📧 Adding Gmail account:', userInfo.email, 'to user:', stateData.userId);
          
          // Check if account already exists for THIS user
          const existingAccount = await GmailAccount.findOne({ 
            email: userInfo.email, 
            user: stateData.userId
          });

          if (existingAccount) {
            console.log('❌ Account already exists for this user');
            return res.redirect(`http://localhost:3000/dashboard?error=Account already connected`);
          }

          // Create new Gmail account linked to the EXISTING user
          await GmailAccount.create({
            user: stateData.userId,
            email: userInfo.email,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiryDate: tokens.expiry_date,
            historyId,
          });
          
          console.log('✅ Successfully added Gmail account:', userInfo.email, 'to user:', stateData.userId);
          return res.redirect(`http://localhost:3000/dashboard?message=Gmail account ${userInfo.email} added successfully`);
        }
      } catch (stateError) {
        console.log('⚠️ Could not parse state, treating as new sign-in');
      }
    }

    // Default flow: New user sign-in
    console.log('👤 New user sign-in flow for:', userInfo.email);
    
    // Find or create user
    let user = await User.findOne({ email: userInfo.email });
    if (!user) {
      user = await User.create({ email: userInfo.email, name: userInfo.name });
      console.log('👤 Created new user:', userInfo.email);
    } else {
      console.log('👤 Found existing user:', userInfo.email);
    }

    // Store or update Gmail account
    let account = await GmailAccount.findOne({ email: userInfo.email, user: user._id });
    if (!account) {
      await GmailAccount.create({
        user: user._id,
        email: userInfo.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiryDate: tokens.expiry_date,
        historyId,
      });
      console.log('📧 Created new Gmail account for user:', userInfo.email);
    } else {
      account.accessToken = tokens.access_token;
      account.refreshToken = tokens.refresh_token || account.refreshToken;
      account.tokenExpiryDate = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000));
      if (!account.historyId && historyId) {
        account.historyId = historyId;
      }
      await account.save();
      console.log(' Updated existing Gmail account for user:', userInfo.email);
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend dashboard with token
    res.redirect(`http://localhost:3000/dashboard?token=${jwtToken}`);

  } catch (err) {
    console.error('❌ OAuth error:', err);
    res.status(500).send('Failed to authenticate with Google.');
  }
};
