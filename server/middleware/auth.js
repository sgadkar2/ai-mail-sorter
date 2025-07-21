// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    if (process.env.NODE_ENV === 'test') {
      user = await global.__MONGO_CONN__.model('User').findById(decoded.userId);
    } else {
      user = await User.findById(decoded.userId);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
