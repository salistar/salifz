/**
 * Salifz Backend - Entry Point
 * Version 3.0.0
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Socket.IO avec configuration avancée
const io = new Server(server, {
  cors: { 
    origin: process.env.SOCKET_CORS_ORIGIN || '*', 
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT) || 60000,
  pingInterval: Number(process.env.SOCKET_PING_INTERVAL) || 25000,
  maxHttpBufferSize: Number(process.env.SOCKET_MAX_HTTP_BUFFER_SIZE) || 1000000,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salifz';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
const routes = require('./routes');
app.use('/api/v1', routes);

// ============================================
// VERIFICATION ROUTES
// ============================================
// Routes pour Phone/Email/Biometric verification
try {
  const verificationRoutes = require('./routes/verification');
  app.use('/api/v1/verification', verificationRoutes);
  console.log('✅ Verification routes loaded');
} catch (err) {
  console.warn('⚠️ Verification routes not found, skipping...');
}

// ============================================
// CHAT ROUTES
// ============================================
// Routes pour le système de chat REST
try {
  const chatRoutes = require('./routes/chat');
  app.use('/api/v1/chat', chatRoutes);
  console.log('✅ Chat routes loaded');
} catch (err) {
  console.warn('⚠️ Chat routes not found, skipping...');
}

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ============================================
// SOCKET.IO - Users & Connections Management
// ============================================
const activeUsers = new Map(); // userId -> Set of socketIds
const socketToUser = new Map(); // socketId -> userId

/**
 * Get user from JWT token
 */
const getUserFromToken = async (token) => {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to get user from database
    try {
      const User = require('./models/User');
      const user = await User.findById(decoded.id).select('-password');
      return user;
    } catch (err) {
      // If User model not found, return decoded token data
      return { _id: decoded.id, id: decoded.id };
    }
  } catch (err) {
    return null;
  }
};

/**
 * Send notification to a specific user
 */
const sendNotificationToUser = (userId, notification) => {
  const userSockets = activeUsers.get(userId);
  if (userSockets) {
    userSockets.forEach(socketId => {
      io.to(socketId).emit('notification', notification);
    });
  }
};

/**
 * Check if user is online
 */
const isUserOnline = (userId) => {
  return activeUsers.has(userId) && activeUsers.get(userId).size > 0;
};

/**
 * Get list of online users
 */
const getOnlineUsers = () => {
  return Array.from(activeUsers.keys());
};

// ============================================
// SOCKET.IO - Authentication Middleware
// ============================================
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      // Allow connection without auth for public features
      socket.user = null;
      return next();
    }
    
    const user = await getUserFromToken(token);
    if (user) {
      socket.user = user;
      next();
    } else {
      // Allow connection but mark as unauthenticated
      socket.user = null;
      next();
    }
  } catch (err) {
    console.error('[SOCKET] Auth error:', err.message);
    socket.user = null;
    next();
  }
});

// ============================================
// SOCKET.IO - Connection Events
// ============================================
io.on('connection', (socket) => {
  const userId = socket.user?._id?.toString() || socket.user?.id;
  
  console.log(`🔌 Socket connected: ${socket.id}${userId ? ` (User: ${userId})` : ' (Anonymous)'}`);
  
  // Track authenticated users
  if (userId) {
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);
    socketToUser.set(socket.id, userId);
    
    // Notify others that user is online
    socket.broadcast.emit('userOnline', { 
      userId, 
      timestamp: new Date() 
    });
    
    // Join personal notification room
    socket.join(`notifications:${userId}`);
  }
  
  // ============================================
  // ROOM MANAGEMENT (Original)
  // ============================================
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`[SOCKET] ${socket.id} joined room: ${roomId}`);
    
    // Notify room members
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userId: userId,
      roomId: roomId,
      timestamp: new Date()
    });
  });
  
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`[SOCKET] ${socket.id} left room: ${roomId}`);
    
    // Notify room members
    socket.to(roomId).emit('user-left', {
      socketId: socket.id,
      userId: userId,
      roomId: roomId,
      timestamp: new Date()
    });
  });
  
  // ============================================
  // CHAT MESSAGES
  // ============================================
  socket.on('send-message', (data) => {
    const messageData = {
      ...data,
      id: data.id || Date.now().toString(),
      senderId: userId || data.senderId,
      senderName: socket.user?.username || data.senderName || 'Anonymous',
      timestamp: new Date(),
      status: 'sent'
    };
    
    io.to(data.roomId).emit('new-message', messageData);
    console.log(`[CHAT] Message sent to room ${data.roomId}`);
  });
  
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('typing', {
      userId: userId,
      username: socket.user?.username,
      isTyping: data.isTyping,
      roomId: data.roomId
    });
  });
  
  socket.on('message-read', (data) => {
    socket.to(data.roomId).emit('message-read', {
      messageId: data.messageId,
      userId: userId,
      readAt: new Date()
    });
  });
  
  // ============================================
  // HALAQA (Study Groups)
  // ============================================
  socket.on('joinHalaqa', (data) => {
    const halaqaRoom = `halaqa:${data.halaqaId}`;
    socket.join(halaqaRoom);
    console.log(`[HALAQA] ${socket.id} joined halaqa: ${data.halaqaId}`);
    
    // Notify halaqa members
    io.to(halaqaRoom).emit('memberJoined', {
      userId: userId,
      username: socket.user?.username,
      halaqaId: data.halaqaId,
      timestamp: new Date()
    });
  });
  
  socket.on('leaveHalaqa', (data) => {
    const halaqaRoom = `halaqa:${data.halaqaId}`;
    socket.leave(halaqaRoom);
    console.log(`[HALAQA] ${socket.id} left halaqa: ${data.halaqaId}`);
    
    // Notify halaqa members
    io.to(halaqaRoom).emit('memberLeft', {
      userId: userId,
      username: socket.user?.username,
      halaqaId: data.halaqaId,
      timestamp: new Date()
    });
  });
  
  socket.on('halaqaMessage', (data) => {
    const halaqaRoom = `halaqa:${data.halaqaId}`;
    const messageData = {
      id: Date.now().toString(),
      senderId: userId,
      senderName: socket.user?.username || 'Anonymous',
      text: data.message,
      type: data.type || 'text',
      timestamp: new Date()
    };
    
    io.to(halaqaRoom).emit('halaqaMessage', messageData);
    console.log(`[HALAQA] Message sent to halaqa ${data.halaqaId}`);
  });
  
  socket.on('halaqaAnnouncement', (data) => {
    const halaqaRoom = `halaqa:${data.halaqaId}`;
    io.to(halaqaRoom).emit('halaqaMessage', {
      id: Date.now().toString(),
      senderId: userId,
      senderName: socket.user?.username,
      text: data.message,
      type: 'announcement',
      timestamp: new Date()
    });
  });
  
  // ============================================
  // CALLS - Signaling (Audio/Video)
  // ============================================
  socket.on('initiateCall', (data) => {
    const { recipientId, type } = data;
    const recipientSockets = activeUsers.get(recipientId);
    
    if (recipientSockets && recipientSockets.size > 0) {
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('incomingCall', {
          callerId: userId,
          callerName: socket.user?.username,
          callerAvatar: socket.user?.profile?.avatar,
          type: type, // 'audio' or 'video'
          roomId: `call:${userId}:${recipientId}`,
          timestamp: new Date()
        });
      });
      console.log(`[CALL] ${userId} calling ${recipientId} (${type})`);
    } else {
      socket.emit('callFailed', { 
        reason: 'User is offline',
        recipientId: recipientId
      });
    }
  });
  
  socket.on('acceptCall', (data) => {
    const { callerId, roomId } = data;
    const callerSockets = activeUsers.get(callerId);
    
    if (callerSockets) {
      callerSockets.forEach(socketId => {
        io.to(socketId).emit('callAccepted', {
          recipientId: userId,
          recipientName: socket.user?.username,
          roomId: roomId || `call:${callerId}:${userId}`
        });
      });
    }
    
    // Both users join the call room
    const callRoom = roomId || `call:${callerId}:${userId}`;
    socket.join(callRoom);
    console.log(`[CALL] Call accepted: ${userId} -> ${callerId}`);
  });
  
  socket.on('rejectCall', (data) => {
    const { callerId } = data;
    const callerSockets = activeUsers.get(callerId);
    
    if (callerSockets) {
      callerSockets.forEach(socketId => {
        io.to(socketId).emit('callRejected', {
          recipientId: userId,
          reason: 'User rejected the call'
        });
      });
    }
    console.log(`[CALL] Call rejected: ${userId} -> ${callerId}`);
  });
  
  socket.on('endCall', (data) => {
    const { recipientId, roomId } = data;
    const recipientSockets = activeUsers.get(recipientId);
    
    if (recipientSockets) {
      recipientSockets.forEach(socketId => {
        io.to(socketId).emit('callEnded', {
          callerId: userId,
          reason: 'Call ended'
        });
      });
    }
    
    // Leave call room
    if (roomId) {
      socket.leave(roomId);
      io.to(roomId).emit('callEnded', { endedBy: userId });
    }
    console.log(`[CALL] Call ended: ${userId} -> ${recipientId}`);
  });
  
  // ============================================
  // WEBRTC Signaling (Original + Enhanced)
  // ============================================
  socket.on('webrtc-offer', (data) => {
    socket.to(data.roomId).emit('webrtc-offer', {
      ...data,
      senderId: socket.id,
      userId: userId
    });
  });
  
  socket.on('webrtc-answer', (data) => {
    socket.to(data.roomId).emit('webrtc-answer', {
      ...data,
      senderId: socket.id,
      userId: userId
    });
  });
  
  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.roomId).emit('webrtc-ice-candidate', {
      ...data,
      senderId: socket.id,
      userId: userId
    });
  });
  
  socket.on('callSignal', (data) => {
    // Generic WebRTC signal handler
    socket.to(data.roomId).emit('callSignal', {
      ...data,
      senderId: socket.id,
      userId: userId
    });
  });
  
  // ============================================
  // PRESENCE
  // ============================================
  socket.on('presence-update', (data) => {
    if (userId) {
      socket.broadcast.emit('user-presence', {
        userId: userId,
        status: data.status, // online, away, busy, offline
        lastSeen: new Date()
      });
    }
  });
  
  socket.on('getOnlineUsers', (callback) => {
    if (typeof callback === 'function') {
      callback(getOnlineUsers());
    }
  });
  
  socket.on('checkUserOnline', (data, callback) => {
    if (typeof callback === 'function') {
      callback(isUserOnline(data.userId));
    }
  });
  
  // ============================================
  // NOTIFICATIONS
  // ============================================
  socket.on('subscribeNotifications', (data) => {
    if (data.userId) {
      socket.join(`notifications:${data.userId}`);
    }
  });
  
  socket.on('sendNotification', (data) => {
    // Admin/System can send notifications to users
    sendNotificationToUser(data.userId, data.notification);
  });
  
  // ============================================
  // DISCONNECT
  // ============================================
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    
    if (userId) {
      // Remove from active users
      const userSockets = activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        // If no more connections, user is offline
        if (userSockets.size === 0) {
          activeUsers.delete(userId);
          
          // Notify others that user is offline
          socket.broadcast.emit('userOffline', {
            userId: userId,
            lastSeen: new Date()
          });
        }
      }
      
      socketToUser.delete(socket.id);
    }
  });
  
  // ============================================
  // ERROR HANDLING
  // ============================================
  socket.on('error', (error) => {
    console.error(`[SOCKET] Error on ${socket.id}:`, error);
  });
});

// ============================================
// EXPORT IO UTILITIES
// ============================================
// Attach utilities to io for use in routes/controllers
io.sendNotificationToUser = sendNotificationToUser;
io.isUserOnline = isUserOnline;
io.getOnlineUsers = getOnlineUsers;
io.activeUsers = activeUsers;

// Make io available globally (optional, for controllers)
app.set('io', io);

// Start Server
const PORT = process.env.PORT || 8088;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     📖 Salifz API Server v3.0.0                   ║
║                                                       ║
║     🚀 Running on port ${PORT}                          ║
║     📊 MongoDB: ${MONGODB_URI.includes('localhost') ? 'Local' : 'Atlas'}                             ║
║     🔌 Socket.IO: Enabled                            ║
║     💬 Chat: Enabled                                 ║
║     📞 Calls: Enabled                                ║
║     🕌 Halaqa: Enabled                               ║
║                                                       ║
║     Endpoints: 30+ routes                            ║
║     Features: 90+ features                           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };