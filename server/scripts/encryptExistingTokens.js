require('dotenv').config();
const mongoose = require('mongoose');
const GmailAccount = require('../models/GmailAccount');
const { encryptToken } = require('../utils/encryption');

async function encryptExistingTokens() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find all Gmail accounts with unencrypted tokens
    const accounts = await GmailAccount.find({
      $or: [
        { accessToken: { $regex: /^[A-Za-z0-9\-._~+/]+=*$/ } }, // Base64 pattern
        { refreshToken: { $regex: /^[A-Za-z0-9\-._~+/]+=*$/ } }  // Base64 pattern
      ]
    });
    
    console.log(`Found ${accounts.length} accounts with potentially unencrypted tokens`);
    
    let updatedCount = 0;
    
    for (const account of accounts) {
      try {
        // Check if tokens are already encrypted
        const accessTokenEncrypted = account.accessToken.includes(':');
        const refreshTokenEncrypted = account.refreshToken.includes(':');
        
        if (!accessTokenEncrypted || !refreshTokenEncrypted) {
          // Create a new document with encrypted tokens
          const encryptedAccount = new GmailAccount({
            user: account.user,
            email: account.email,
            accessToken: account.accessToken, // Will be encrypted by setter
            refreshToken: account.refreshToken, // Will be encrypted by setter
            tokenExpiryDate: account.tokenExpiryDate,
            historyId: account.historyId,
            createdAt: account.createdAt,
          });
          
          // Save the encrypted version
          await encryptedAccount.save();
          
          // Remove the old unencrypted document
          await GmailAccount.findByIdAndDelete(account._id);
          
          updatedCount++;
          console.log(`✅ Encrypted tokens for account: ${account.email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to encrypt account ${account.email}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Encrypted ${updatedCount} accounts`);
    console.log(`📊 Total accounts processed: ${accounts.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  encryptExistingTokens();
}

module.exports = encryptExistingTokens;
