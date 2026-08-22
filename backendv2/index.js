/**
 * Salifz Backend - Entry Point
 * Version 3.0.0
 * ✅ NEW: Khatam Socket.IO events added
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

const { loadConfig } = require('./config/env');
const { verifyAccessToken } = require('./utils/tokens');
const { globalLimiter } = require('./middleware/rateLimit');
const { resolveRoom, isHalaqaModerator, isKhatamModerator } = require('./sockets/authorization');
const { formatHalaqaMessage } = require('./utils/halaqaMessage');

// Charge et valide la configuration. Si un secret manque, est trop court ou
// est resté à sa valeur d'exemple, le démarrage échoue ici — plutôt que de
// retomber silencieusement sur un secret en dur (S7).
let config;
try {
  config = loadConfig();
} catch (error) {
  console.error(`\n❌ ${error.message}\n`);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Nécessaire derrière un reverse proxy pour que la limitation de débit voie
// la vraie IP cliente et non celle du proxy.
app.set('trust proxy', 1);

// Socket.IO avec configuration avancée
const io = new Server(server, {
  // S9 : `origin: '*'` avec `credentials: true` est à la fois invalide et
  // permissif. La liste est désormais explicite et obligatoire en production.
  cors: {
    origin: config.corsOrigins,
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
app.use(cors({ origin: config.corsOrigins, credentials: true }));

// S17 : 10 Mo étaient acceptés sur toutes les routes, y compris /auth/login.
// Les uploads (audio du tajwid, photos) passent par multer, qui a ses propres
// limites — le JSON n'a pas besoin d'aller au-delà de 256 Ko.
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// S8 : filet général de limitation de débit, avant toute route.
app.use(globalLimiter);

// MongoDB Connection
const MONGODB_URI = config.mongoUri;
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// S16 : présence, sessions de khatam et signalisation d'appel vivent dans des
// Map locales au processus. Avec plus d'une instance, deux utilisateurs servis
// par des instances différentes ne se voient pas. L'adaptateur Redis rétablit
// la diffusion inter-instances dès qu'une URL Redis est fournie ; en son
// absence, le serveur reste mono-instance et le dit clairement.
if (process.env.REDIS_URL) {
  (async () => {
    try {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const { createClient } = require('redis');
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.IO : adaptateur Redis actif (multi-instance)');
    } catch (err) {
      console.error('❌ Adaptateur Redis indisponible :', err.message);
      if (config.isProduction) process.exit(1);
    }
  })();
} else if (config.isProduction) {
  console.warn(
    '⚠️  REDIS_URL absent : le temps réel ne fonctionnera correctement ' +
    "qu'avec une seule instance de ce serveur."
  );
}

// Enregistrements de recitation. En production, ces fichiers doivent
// partir vers un stockage objet : le disque d'une instance est ephemere.
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads'), {
  maxAge: '1h',
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

// Routes
const routes = require('./routes');
app.use('/api/v1', routes);

// `/verification`, `/chat` et `/khatam` étaient montés une seconde fois ici,
// après `routes/index.js` qui les monte déjà — mais sans middleware
// d'authentification. Ces montages morts sont supprimés : routes/index.js est
// le point de montage unique.

// S12 : `err.message` était renvoyé brut au client, exposant messages
// Mongoose, contraintes de schéma et chemins internes. Le détail reste dans
// les logs ; le client ne reçoit un message que pour les erreurs
// intentionnelles (statut < 500).
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${status}`, err.stack || err.message);

  res.status(status).json({
    success: false,
    error: status < 500 ? err.message : 'Erreur interne du serveur',
    ...(err.code && { code: err.code }),
  });
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

// ✅ NEW: Khatam live sessions tracking
const khatamSessions = new Map(); // khatamId -> { participants: Set, currentHizb, startedAt, startedBy }

/**
 * Get user from JWT token
 */
const getUserFromToken = async (token) => {
  try {
    if (!token) return null;

    // Vérifie la signature, le secret dédié ET le type « access » : un jeton
    // de rafraîchissement ou de réinitialisation est refusé ici (S2).
    const payload = verifyAccessToken(token);

    const User = require('./models/User');
    // L'ancien code retombait sur les données du jeton si le modèle n'était pas
    // chargeable : un jeton suffisait alors à exister sans compte en base.
    return await User.findById(payload.sub).select('-password');
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
// S4 : une connexion sans jeton valide était acceptée, `socket.user` restait
// à null, et tous les handlers continuaient de fonctionner. Un client anonyme
// pouvait rejoindre n'importe quel salon et y publier des messages.
// La connexion est désormais refusée sans authentification.
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if (!token) {
    return next(new Error('UNAUTHENTICATED'));
  }

  try {
    const user = await getUserFromToken(token);
    if (!user) return next(new Error('UNAUTHENTICATED'));

    if (user.status === 'banned' || user.status === 'suspended' || user.isActive === false) {
      return next(new Error('ACCOUNT_BLOCKED'));
    }

    socket.user = user;
    return next();
  } catch (err) {
    console.error('[SOCKET] Auth error:', err.message);
    return next(new Error('UNAUTHENTICATED'));
  }
});

// ============================================
// SOCKET.IO - Connection Events
// ============================================
// Brancher la présence sur la couche temps réel. Ce register() n'était
// appelé que depuis sockets/index.js (code mort supprimé) : sans lui,
// presence.isAvailable() restait false et la liste d'amis affichait
// « présence inconnue » en permanence.
require('./services/presence').register(io);

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
  socket.on('join-room', async (roomId) => {
    // S4 : aucun contrôle d'appartenance n'était fait ici.
    const allowed = await resolveRoom(userId, roomId);
    if (!allowed) {
      return socket.emit('room-denied', { roomId, reason: 'FORBIDDEN' });
    }

    socket.join(allowed);
    console.log(`[SOCKET] ${socket.id} joined room: ${allowed}`);

    socket.to(allowed).emit('user-joined', {
      socketId: socket.id,
      userId: userId,
      roomId: allowed,
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
    // On ne peut écrire que dans un salon qu'on a effectivement rejoint,
    // donc qui a passé le contrôle d'appartenance de `join-room`.
    if (!socket.rooms.has(data?.roomId)) {
      return socket.emit('message-rejected', { roomId: data?.roomId, reason: 'NOT_IN_ROOM' });
    }

    const messageData = {
      // L'identité vient du jeton, jamais du payload : `senderId: userId ||
      // data.senderId` permettait d'usurper n'importe quel expéditeur (S4).
      id: Date.now().toString(),
      roomId: data.roomId,
      text: typeof data.text === 'string' ? data.text.slice(0, 4000) : '',
      type: data.type === 'audio' || data.type === 'image' ? data.type : 'text',
      senderId: userId,
      senderName: socket.user.username,
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
  socket.on('joinHalaqa', async (data) => {
    const halaqaRoom = `halaqa:${data?.halaqaId}`;
    // S4 : n'importe quel identifiant de halaqa était accepté.
    if (!(await resolveRoom(userId, halaqaRoom))) {
      return socket.emit('room-denied', { roomId: halaqaRoom, reason: 'NOT_A_MEMBER' });
    }

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
  
  socket.on('halaqaMessage', async (data) => {
    const halaqaRoom = `halaqa:${data?.halaqaId}`;
    if (!socket.rooms.has(halaqaRoom)) {
      return socket.emit('message-rejected', { roomId: halaqaRoom, reason: 'NOT_IN_ROOM' });
    }

    // Le message peut arriver en chaîne (web) ou enveloppé (ancien mobile).
    const brut = typeof data.message === 'string'
      ? data.message
      : (data.message?.content ?? data.message?.text ?? '');
    const content = String(brut).slice(0, 4000).trim();
    if (!content) {
      return socket.emit('message-rejected', { roomId: halaqaRoom, reason: 'EMPTY' });
    }

    // Persister AVANT de diffuser : ce handler ne faisait que re-diffuser,
    // les messages disparaissaient au premier rechargement (base vide).
    try {
      const Halaqa = require('./models/Halaqa');
      const halaqa = await Halaqa.findById(data.halaqaId);
      if (!halaqa) {
        return socket.emit('message-rejected', { roomId: halaqaRoom, reason: 'NOT_FOUND' });
      }
      const saved = await halaqa.addMessage(userId, content, data.type === 'audio' ? 'audio' : 'text');
      io.to(halaqaRoom).emit('halaqaMessage', formatHalaqaMessage(data.halaqaId, saved, socket.user));
      console.log(`[HALAQA] Message persisted + sent to halaqa ${data.halaqaId}`);
    } catch (e) {
      return socket.emit('message-rejected', { roomId: halaqaRoom, reason: e.message });
    }
  });

  socket.on('halaqaAnnouncement', async (data) => {
    const halaqaRoom = `halaqa:${data?.halaqaId}`;
    if (!socket.rooms.has(halaqaRoom)) {
      return socket.emit('message-rejected', { roomId: halaqaRoom, reason: 'NOT_IN_ROOM' });
    }

    // Une annonce s'affiche différemment d'un message : elle est réservée aux
    // responsables de la halaqa.
    if (!(await isHalaqaModerator(userId, data.halaqaId))) {
      return socket.emit('message-rejected', { roomId: halaqaRoom, reason: 'NOT_A_MODERATOR' });
    }

    io.to(halaqaRoom).emit('halaqaMessage', {
      id: Date.now().toString(),
      senderId: userId,
      senderName: socket.user.username,
      text: typeof data.message === 'string' ? data.message.slice(0, 4000) : '',
      type: 'announcement',
      timestamp: new Date()
    });
  });

  // ============================================
  // ✅ NEW: KHATAM QURAN EVENTS
  // ============================================
  
  // Join Khatam Room
  socket.on('joinKhatam', async (data) => {
    const khatamRoom = `khatam:${data?.khatamId}`;
    // S4 : idem, aucun contrôle de participation n'était fait.
    if (!(await resolveRoom(userId, khatamRoom))) {
      return socket.emit('room-denied', { roomId: khatamRoom, reason: 'NOT_A_PARTICIPANT' });
    }

    socket.join(khatamRoom);
    console.log(`[KHATAM] ${socket.id} joined khatam: ${data.khatamId}`);
    
    // Notify khatam members
    io.to(khatamRoom).emit('khatamMemberJoined', {
      userId: userId,
      username: socket.user?.username,
      avatar: socket.user?.profile?.avatar,
      khatamId: data.khatamId,
      timestamp: new Date()
    });
    
    // Send current session info if exists
    const session = khatamSessions.get(data.khatamId);
    if (session && session.active) {
      socket.emit('khatamSessionInfo', {
        khatamId: data.khatamId,
        active: true,
        currentHizb: session.currentHizb,
        currentAyah: session.currentAyah,
        startedAt: session.startedAt,
        participantCount: session.participants.size
      });
    }
  });
  
  // Leave Khatam Room
  socket.on('leaveKhatam', (data) => {
    const khatamRoom = `khatam:${data.khatamId}`;
    socket.leave(khatamRoom);
    console.log(`[KHATAM] ${socket.id} left khatam: ${data.khatamId}`);
    
    // Remove from live session if active
    const session = khatamSessions.get(data.khatamId);
    if (session) {
      session.participants.delete(userId);
    }
    
    // Notify khatam members
    io.to(khatamRoom).emit('khatamMemberLeft', {
      userId: userId,
      username: socket.user?.username,
      khatamId: data.khatamId,
      timestamp: new Date()
    });
  });
  
  // Hizb Assigned
  socket.on('khatamHizbAssigned', (data) => {
    const khatamRoom = `khatam:${data.khatamId}`;
    // On ne peut diffuser que dans un salon qu'on a effectivement rejoint
    // (donc passé le contrôle d'appartenance de joinKhatam). Sans ce garde,
    // n'importe quel compte injectait des événements dans un khatam tiers.
    if (!socket.rooms.has(khatamRoom)) return;
    io.to(khatamRoom).emit('khatamHizbAssigned', {
      khatamId: data.khatamId,
      hizbNumber: data.hizbNumber,
      userId: userId,
      username: socket.user?.username,
      avatar: socket.user?.profile?.avatar,
      timestamp: new Date()
    });
    console.log(`[KHATAM] Hizb ${data.hizbNumber} assigned to ${userId} in khatam ${data.khatamId}`);
  });
  
  // Hizb Completed
  socket.on('khatamHizbCompleted', (data) => {
    const khatamRoom = `khatam:${data.khatamId}`;
    if (!socket.rooms.has(khatamRoom)) return;
    io.to(khatamRoom).emit('khatamHizbCompleted', {
      khatamId: data.khatamId,
      hizbNumber: data.hizbNumber,
      userId: userId,
      username: socket.user?.username,
      avatar: socket.user?.profile?.avatar,
      progress: data.progress,
      timestamp: new Date()
    });
    console.log(`[KHATAM] Hizb ${data.hizbNumber} completed by ${userId} in khatam ${data.khatamId}`);
  });
  
  // Hizb Verified
  socket.on('khatamHizbVerified', (data) => {
    const khatamRoom = `khatam:${data.khatamId}`;
    if (!socket.rooms.has(khatamRoom)) return;
    io.to(khatamRoom).emit('khatamHizbVerified', {
      khatamId: data.khatamId,
      hizbNumber: data.hizbNumber,
      verifiedBy: userId,
      verifierName: socket.user?.username,
      timestamp: new Date()
    });
    console.log(`[KHATAM] Hizb ${data.hizbNumber} verified in khatam ${data.khatamId}`);
  });
  
  // Khatam Progress Update
  socket.on('khatamProgressUpdate', (data) => {
    const khatamRoom = `khatam:${data.khatamId}`;
    if (!socket.rooms.has(khatamRoom)) return;
    io.to(khatamRoom).emit('khatamProgressUpdate', {
      khatamId: data.khatamId,
      progress: data.progress,
      totalCompleted: data.totalCompleted,
      khatamCount: data.khatamCount,
      timestamp: new Date()
    });
  });
  
  // Khatam Completed (all 60 hizb done)
  socket.on('khatamCompleted', (data) => {
    const khatamRoom = `khatam:${data.khatamId}`;
    if (!socket.rooms.has(khatamRoom)) return;
    io.to(khatamRoom).emit('khatamCompleted', {
      khatamId: data.khatamId,
      khatamCount: data.khatamCount,
      completedBy: data.participants,
      timestamp: new Date()
    });
    console.log(`[KHATAM] 🎉 Khatam ${data.khatamId} completed!`);
  });
  
  // ============================================
  // ✅ NEW: KHATAM LIVE SESSION EVENTS
  // ============================================
  
  // Start Live Reading Session
  socket.on('khatamSessionStart', (data) => {
    const khatamRoom = `khatam:${data.khatamId}`;
    // Ne créer/écraser une session que dans un khatam rejoint : sinon une
    // boucle d'émissions gonflait khatamSessions avec des clés arbitraires,
    // et on pouvait écraser la session en cours d'un groupe légitime.
    if (!socket.rooms.has(khatamRoom)) return;

    // Initialize session
    khatamSessions.set(data.khatamId, {
      active: true,
      startedAt: new Date(),
      startedBy: userId,
      currentHizb: data.hizbNumber || 1,
      currentAyah: data.ayah || { surah: 1, ayah: 1 },
      participants: new Set([userId])
    });
    
    io.to(khatamRoom).emit('khatamSessionStarted', {
      khatamId: data.khatamId,
      startedBy: userId,
      starterName: socket.user?.username,
      currentHizb: data.hizbNumber || 1,
      timestamp: new Date()
    });
    
    console.log(`[KHATAM] 🎙️ Live session started for khatam ${data.khatamId} by ${userId}`);
  });
  
  // Join Live Session
  socket.on('khatamSessionJoin', (data) => {
    const session = khatamSessions.get(data.khatamId);
    if (session && session.active) {
      session.participants.add(userId);
      
      const khatamRoom = `khatam:${data.khatamId}`;
      io.to(khatamRoom).emit('khatamSessionParticipantJoined', {
        khatamId: data.khatamId,
        userId: userId,
        username: socket.user?.username,
        participantCount: session.participants.size,
        timestamp: new Date()
      });
      
      // Send current position to new participant
      socket.emit('khatamSessionSync', {
        khatamId: data.khatamId,
        currentHizb: session.currentHizb,
        currentAyah: session.currentAyah,
        participantCount: session.participants.size
      });
    }
  });
  
  // Update Current Reading Position
  socket.on('khatamSessionPosition', (data) => {
    const session = khatamSessions.get(data.khatamId);
    if (session && session.active) {
      session.currentHizb = data.hizbNumber;
      session.currentAyah = data.ayah;
      
      const khatamRoom = `khatam:${data.khatamId}`;
      socket.to(khatamRoom).emit('khatamSessionPositionUpdate', {
        khatamId: data.khatamId,
        hizbNumber: data.hizbNumber,
        ayah: data.ayah,
        updatedBy: userId,
        timestamp: new Date()
      });
    }
  });
  
  // Live Session Chat/Voice Message
  socket.on('khatamSessionMessage', (data) => {
    const khatamRoom = `khatam:${data.khatamId}`;
    io.to(khatamRoom).emit('khatamSessionMessage', {
      id: Date.now().toString(),
      khatamId: data.khatamId,
      senderId: userId,
      senderName: socket.user?.username,
      message: data.message,
      type: data.type || 'text', // text, audio, system
      timestamp: new Date()
    });
  });
  
  // End Live Session
  socket.on('khatamSessionEnd', async (data) => {
    const session = khatamSessions.get(data?.khatamId);
    if (session) {
      // S5 : la condition était `session.startedBy === userId || data.isAdmin`,
      // et `data.isAdmin` venait du client. Le statut de modérateur est
      // maintenant lu en base.
      const isModerator = await isKhatamModerator(userId, data.khatamId);
      if (session.startedBy === userId || isModerator) {
        const khatamRoom = `khatam:${data.khatamId}`;
        io.to(khatamRoom).emit('khatamSessionEnded', {
          khatamId: data.khatamId,
          endedBy: userId,
          enderName: socket.user?.username,
          duration: Date.now() - session.startedAt.getTime(),
          lastHizb: session.currentHizb,
          timestamp: new Date()
        });
        
        khatamSessions.delete(data.khatamId);
        console.log(`[KHATAM] 🎙️ Live session ended for khatam ${data.khatamId}`);
      }
    }
  });
  
  // Leave Live Session (but stay in khatam)
  socket.on('khatamSessionLeave', (data) => {
    const session = khatamSessions.get(data.khatamId);
    if (session) {
      session.participants.delete(userId);
      
      const khatamRoom = `khatam:${data.khatamId}`;
      io.to(khatamRoom).emit('khatamSessionParticipantLeft', {
        khatamId: data.khatamId,
        userId: userId,
        username: socket.user?.username,
        participantCount: session.participants.size,
        timestamp: new Date()
      });
      
      // Auto-end session if no participants
      if (session.participants.size === 0) {
        io.to(khatamRoom).emit('khatamSessionEnded', {
          khatamId: data.khatamId,
          reason: 'No participants remaining',
          timestamp: new Date()
        });
        khatamSessions.delete(data.khatamId);
      }
    }
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
  // Signalisation WebRTC : `socket.to(x)` diffuse dans `x` que l'émetteur y
  // soit ou non. Sans garde, connaissant le nom déterministe d'un salon
  // d'appel, un tiers pouvait y injecter une offre et renégocier/couper la
  // session. On n'autorise la signalisation que dans un salon rejoint.
  const relayerSignal = (evenement) => (data) => {
    if (!data?.roomId || !socket.rooms.has(data.roomId)) return;
    socket.to(data.roomId).emit(evenement, {
      ...data,
      senderId: socket.id,
      userId: userId
    });
  };

  socket.on('webrtc-offer', relayerSignal('webrtc-offer'));
  socket.on('webrtc-answer', relayerSignal('webrtc-answer'));
  socket.on('webrtc-ice-candidate', relayerSignal('webrtc-ice-candidate'));
  socket.on('callSignal', relayerSignal('callSignal'));
  
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
  socket.on('subscribeNotifications', () => {
    // On ne s'abonne qu'à son propre canal. L'ancien code prenait
    // `data.userId` du client : il suffisait d'envoyer l'identifiant d'un
    // autre utilisateur pour recevoir ses notifications.
    socket.join(`notifications:${userId}`);
  });

  // S6 : l'événement `sendNotification` permettait à n'importe quel client
  // d'envoyer une notification arbitraire à n'importe quel utilisateur.
  // Les notifications sont désormais émises exclusivement côté serveur, via
  // `io.sendNotificationToUser` appelé depuis les routes.
  
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
      
      // ✅ NEW: Clean up from khatam sessions
      khatamSessions.forEach((session, khatamId) => {
        if (session.participants.has(userId)) {
          session.participants.delete(userId);
          
          // Notify khatam room
          io.to(`khatam:${khatamId}`).emit('khatamSessionParticipantLeft', {
            khatamId: khatamId,
            userId: userId,
            participantCount: session.participants.size,
            reason: 'disconnected',
            timestamp: new Date()
          });
          
          // Auto-end session if no participants
          if (session.participants.size === 0) {
            io.to(`khatam:${khatamId}`).emit('khatamSessionEnded', {
              khatamId: khatamId,
              reason: 'No participants remaining',
              timestamp: new Date()
            });
            khatamSessions.delete(khatamId);
          }
        }
      });
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
io.khatamSessions = khatamSessions; // ✅ NEW: Export khatam sessions

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
║     📚 Khatam: Enabled                               ║
║                                                       ║
║     Endpoints: 32+ routes                            ║
║     Features: 95+ features                           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };