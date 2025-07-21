const crypto = require('crypto');

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be a 64-character hex string in .env file');
}

// Convert hex key to buffer
const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');

function encryptToken(token) {
  if (!token) return token;
  
  try {
    // Generate random IV
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipher('aes-256-cbc', keyBuffer);
    
    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV + encrypted data (IV is needed for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return token; // Fallback to plain text if encryption fails
  }
}

function decryptToken(encryptedToken) {
  if (!encryptedToken) return encryptedToken;
  
  try {
    // Check if token is already encrypted (has IV separator)
    if (!encryptedToken.includes(':')) {
      return encryptedToken; // Return as-is if not encrypted
    }
    
    // Split IV and encrypted data
    const [ivHex, encryptedData] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipher('aes-256-cbc', keyBuffer);
    
    // Decrypt the token
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedToken; // Return as-is if decryption fails
  }
}

module.exports = {
  encryptToken,
  decryptToken
};
