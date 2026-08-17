/**
 * Socket.IO Handler - Salifz Backend
 */

const jwt = require('jsonwebtoken');
const presence = require('../services/presence');
const User = require('../models/User');

const activeUsers = new Map();
const socketToUser = new Map();

function initializeSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (error) { next(new Error('Invalid token')); }
  });

  presence.register(io);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    // `socket.data` est le seul champ que `fetchSockets()` rapatrie depuis les
    // autres instances : c'est là que l'identifiant doit vivre.
    socket.data.userId = userId;
    console.log(`[Socket] User connected: ${userId}`);
    
    if (!activeUsers.has(userId)) activeUsers.set(userId, new Set());
    activeUsers.get(userId).add(socket.id);
    socketToUser.set(socket.id, userId);
    socket.broadcast.emit('userOnline', { userId });

    // Chat
    socket.on('joinRoom', ({ roomId }) => socket.join(roomId));
    socket.on('leaveRoom', ({ roomId }) => socket.leave(roomId));
    socket.on('sendMessage', ({ roomId, message, type = 'text' }) => {
      io.to(roomId).emit('newMessage', { id: Date.now().toString(), senderId: userId, senderName: socket.user.username, text: message, type, timestamp: new Date(), status: 'sent' });
    });
    socket.on('typing', ({ roomId, isTyping }) => socket.to(roomId).emit('typing', { userId, isTyping }));

    // Calls
    socket.on('initiateCall', ({ recipientId, type }) => {
      const recipientSockets = activeUsers.get(recipientId);
      if (recipientSockets) recipientSockets.forEach(sid => io.to(sid).emit('incomingCall', { callerId: userId, callerName: socket.user.username, type }));
      else socket.emit('callFailed', { reason: 'User offline' });
    });
    socket.on('acceptCall', ({ callerId }) => { const s = activeUsers.get(callerId); if (s) s.forEach(sid => io.to(sid).emit('callAccepted', { recipientId: userId })); });
    socket.on('rejectCall', ({ callerId }) => { const s = activeUsers.get(callerId); if (s) s.forEach(sid => io.to(sid).emit('callRejected', { recipientId: userId })); });
    socket.on('endCall', ({ recipientId }) => { const s = activeUsers.get(recipientId); if (s) s.forEach(sid => io.to(sid).emit('callEnded', { callerId: userId })); });

    // Halaqa
    socket.on('joinHalaqa', ({ halaqaId }) => { socket.join(`halaqa:${halaqaId}`); io.to(`halaqa:${halaqaId}`).emit('memberJoined', { userId, username: socket.user.username }); });
    socket.on('leaveHalaqa', ({ halaqaId }) => { socket.leave(`halaqa:${halaqaId}`); io.to(`halaqa:${halaqaId}`).emit('memberLeft', { userId }); });
    socket.on('halaqaMessage', ({ halaqaId, message }) => {
      io.to(`halaqa:${halaqaId}`).emit('halaqaMessage', { id: Date.now().toString(), senderId: userId, senderName: socket.user.username, text: message, timestamp: new Date(), type: 'text' });
    });

    // Disconnect
    socket.on('disconnect', () => {
      activeUsers.get(userId)?.delete(socket.id);
      socketToUser.delete(socket.id);
      if (activeUsers.get(userId)?.size === 0) { activeUsers.delete(userId); socket.broadcast.emit('userOffline', { userId }); }
    });
  });

  io.sendNotification = (userId, notification) => io.to(`notifications:${userId}`).emit('notification', notification);
  io.isUserOnline = (userId) => activeUsers.has(userId) && activeUsers.get(userId).size > 0;
  return io;
}

module.exports = { initializeSocket };