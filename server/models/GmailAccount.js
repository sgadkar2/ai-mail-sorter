const mongoose = require('mongoose');
const { encryptToken, decryptToken } = require('../utils/encryption');

const gmailAccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  accessToken: { 
    type: String, 
    required: true,
    set: encryptToken,  // Encrypt before saving
    get: decryptToken   // Decrypt when reading
  },
  refreshToken: { 
    type: String, 
    required: true,
    set: encryptToken,  // Encrypt before saving
    get: decryptToken   // Decrypt when reading
  },
  tokenExpiryDate: { type: Date },
  historyId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Ensure getters are applied when querying
gmailAccountSchema.set('toJSON', { getters: true });
gmailAccountSchema.set('toObject', { getters: true });

module.exports = mongoose.model('GmailAccount', gmailAccountSchema);
