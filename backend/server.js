require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Database = require('./database');
const { generateToken, verifyToken, socketAuthMiddleware } = require('./auth');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Initialize database before starting server
(async () => {
  console.log('🔄 Initializing database...');
  await Database.initDatabase();
  console.log('✅ Database ready!');
})();

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

// Store online users: userId -> socketId
const onlineUsers = new Map();

// REST API Routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (username.length < 3 || password.length < 6) {
      return res.status(400).json({ error: 'Username min 3 chars, password min 6 chars' });
    }

    const user = Database.createUser(username, password, displayName);
    const token = generateToken(user);
    
    res.json({ 
      user: { id: user.id, username: user.username, display_name: user.display_name },
      token 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = Database.getUserByUsername(username);
    if (!user || !Database.verifyPassword(user, password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ 
      user: { id: user.id, username: user.username, display_name: user.display_name },
      token 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const users = Database.getAllUsers(decoded.id).map(user => ({
    ...user,
    online: onlineUsers.has(user.id)
  }));
  
  res.json(users);
});

app.get('/api/messages/:userId', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const otherUserId = parseInt(req.params.userId);
  const messages = Database.getMessages(decoded.id, otherUserId);
  
  res.json(messages);
});

// Socket.IO event handlers
io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.username} (${socket.userId})`);
  
  // Mark user as online
  onlineUsers.set(socket.userId, socket.id);
  Database.updateUserStatus(socket.userId, 'online');
  
  // Broadcast online status to all users
  io.emit('user-status', { 
    userId: socket.userId, 
    status: 'online',
    username: socket.username 
  });

  // Send message
  socket.on('send-message', (data) => {
    try {
      const { toUserId, content, type } = data;
      const message = Database.saveMessage(socket.userId, toUserId, content, type || 'text');
      
      // Send to recipient if online
      const recipientSocketId = onlineUsers.get(toUserId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive-message', {
          ...message,
          from_user: { 
            id: socket.userId, 
            username: socket.username 
          }
        });
      }

      // Confirm to sender
      socket.emit('message-sent', { 
        tempId: data.tempId, 
        message 
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('mark-read', ({ fromUserId }) => {
    Database.markMessagesAsRead(fromUserId, socket.userId);
    
    const senderSocketId = onlineUsers.get(fromUserId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('messages-read', {
        byUserId: socket.userId
      });
    }
  });

  // WebRTC signaling for voice/video calls
  socket.on('call-user', ({ toUserId, offer, callType }) => {
    const recipientSocketId = onlineUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('incoming-call', {
        fromUserId: socket.userId,
        fromUsername: socket.username,
        offer,
        callType // 'voice' or 'video'
      });
    } else {
      socket.emit('call-failed', { reason: 'User offline' });
    }
  });

  socket.on('call-answer', ({ toUserId, answer }) => {
    const callerSocketId = onlineUsers.get(toUserId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-answered', {
        fromUserId: socket.userId,
        answer
      });
    }
  });

  socket.on('ice-candidate', ({ toUserId, candidate }) => {
    const recipientSocketId = onlineUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('ice-candidate', {
        fromUserId: socket.userId,
        candidate
      });
    }
  });

  socket.on('end-call', ({ toUserId }) => {
    const recipientSocketId = onlineUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('call-ended', {
        fromUserId: socket.userId
      });
    }
  });

  // Typing indicator
  socket.on('typing', ({ toUserId, isTyping }) => {
    const recipientSocketId = onlineUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user-typing', {
        userId: socket.userId,
        isTyping
      });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.username}`);
    onlineUsers.delete(socket.userId);
    Database.updateUserStatus(socket.userId, 'offline');
    
    io.emit('user-status', { 
      userId: socket.userId, 
      status: 'offline',
      username: socket.username 
    });
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Messenger API running', version: '1.0.0' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Messenger server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${FRONTEND_URL}`);
});
