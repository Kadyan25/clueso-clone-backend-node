// src/middleware/requireAuth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Attach to request for downstream handlers
    req.user = {
      id: payload.userId,
      email: payload.email,
    };
    return next();
  } catch (err) {
    console.error('Invalid JWT:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
