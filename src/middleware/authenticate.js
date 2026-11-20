const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.get('authorization');
  const match = header && header.match(/^Bearer\s+(.+)$/i);
  if (!match || !process.env.JWT_SECRET) return res.status(400).json({ message: 'Authorization Bearer token is required' });
  try {
    req.user = jwt.verify(match[1], process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
