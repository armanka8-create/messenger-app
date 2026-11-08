const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Invalid token'));
  }

  socket.userId = decoded.id;
  socket.username = decoded.username;
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  socketAuthMiddleware
};
