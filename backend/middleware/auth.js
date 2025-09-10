const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // Remove "Bearer " prefix if present
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    if (!actualToken) {
      return res.status(401).json({ error: 'Invalid token format.' });
    }
    
    const decoded = jwt.verify(actualToken, JWT_SECRET);
    req.userId = decoded.user_id;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    } else {
      return res.status(400).json({ error: 'Token verification failed.' });
    }
  }
};

module.exports = verifyToken;