const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ Auth failed: No token provided');
      console.log('   Request path:', req.path);
      console.log('   Authorization header:', authHeader);
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
    console.log('✅ Token verified for user:', decoded.userId);
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ Auth failed: User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    console.log('   Token verification failed');
    console.log('   JWT_SECRET exists:', !!process.env.JWT_SECRET);
    res.status(401).json({ error: 'Invalid authentication token', details: error.message });
  }
};

module.exports = authMiddleware;

