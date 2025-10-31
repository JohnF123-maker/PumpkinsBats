/**
 * Halloween Battle - TikTok Live Server
 * Connects to TikTok Live and relays events to game clients via Socket.IO
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebcastPushConnection } from 'tiktok-live-connector';
import { classifyGiftAction } from './gift-map.js';

// Logging control - disable verbose logs in production to avoid Railway rate limits (500 logs/sec max)
const VERBOSE_LOGGING = process.env.NODE_ENV !== 'production';
const log = {
  info: (msg) => console.log(msg),
  warn: (msg) => console.warn(msg),
  error: (msg) => console.error(msg),
  verbose: (...args) => VERBOSE_LOGGING && console.log(...args)
};

// ES Module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8080;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || '';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true
}));

app.use(express.json());

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Serve static files in production
if (NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    mode: NODE_ENV,
    tiktokConnected: tiktokConnection?.connected || false,
    tiktokUsername: TIKTOK_USERNAME || 'none'
  });
});

// API endpoint to check connection status
app.get('/api/status', (req, res) => {
  res.json({
    server: 'online',
    tiktok: {
      connected: tiktokConnection?.connected || false,
      username: TIKTOK_USERNAME || 'simulation-mode'
    },
    clients: io.engine.clientsCount
  });
});

// TikTok Live Connection
let tiktokConnection = null;

function initTikTokConnection(username) {
  const usernameToUse = username || TIKTOK_USERNAME;
  
  if (!usernameToUse) {
    console.log('⚠️  No TIKTOK_USERNAME provided - running in simulation mode');
    console.log('💡 Set TIKTOK_USERNAME in .env or provide via client to connect to TikTok Live');
    return;
  }

  // Disconnect existing connection if any
  if (tiktokConnection) {
    console.log('🔄 Disconnecting existing TikTok connection...');
    tiktokConnection.disconnect();
  }

  console.log(`🔌 Connecting to TikTok Live: @${usernameToUse}`);
  
  tiktokConnection = new WebcastPushConnection(usernameToUse);

  // Connection events
  tiktokConnection.connect()
    .then(state => {
      console.log(`✅ Connected to @${usernameToUse}'s live stream!`);
      console.log(`📊 State:`, state);
    })
    .catch(err => {
      console.error('❌ Failed to connect to TikTok Live:', err.message);
      console.log('💡 Make sure the user is currently LIVE');
    });

  // Disconnection
  tiktokConnection.on('disconnected', () => {
    console.log('🔌 Disconnected from TikTok Live');
  });

  // Error handling
  tiktokConnection.on('error', (err) => {
    console.error('❌ TikTok connection error:', err);
  });

  // LIKE events
  tiktokConnection.on('like', (data) => {
    const likeCount = data.likeCount || 1;
    log.verbose(`💗 ${data.uniqueId || 'Someone'} sent ${likeCount} like(s)`);
    
    io.emit('like', { 
      count: likeCount,
      user: data.uniqueId 
    });
  });

  // COMMENT events
  tiktokConnection.on('chat', (data) => {
    log.verbose(`💬 ${data.uniqueId}: ${data.comment}`);
    
    io.emit('comment', {
      text: data.comment,
      user: data.uniqueId
    });
  });

  // FOLLOW events
  tiktokConnection.on('social', (data) => {
    if (data.displayType && data.displayType.includes('follow')) {
      log.verbose(`👥 ${data.uniqueId} followed!`);
      
      io.emit('follow', {
        user: data.uniqueId
      });
    }
  });

  // SHARE events
  tiktokConnection.on('share', (data) => {
    log.verbose(`📤 ${data.uniqueId} shared the stream!`);
    
    io.emit('share', {
      user: data.uniqueId
    });
  });

  // GIFT events
  tiktokConnection.on('gift', (data) => {
    const giftName = data.giftName || data.gift?.name || 'Unknown';
    const diamonds = data.diamondCount || data.gift?.diamond_count || 0;
    const giftId = data.gift?.id || 0;
    
    // Get gift action from new schema
    const giftAction = classifyGiftAction(giftName, diamonds);
    
    log.verbose(`🎁 ${data.uniqueId} sent "${giftName}" (${diamonds} 💎) - Action: ${giftAction.action}`);
    
    io.emit('gift', {
      giftName,
      diamonds,
      giftId,
      action: giftAction.action,
      team: giftAction.team,
      count: giftAction.count,
      isLarge: giftAction.isLarge,
      user: data.uniqueId
    });
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  const clientUsername = socket.handshake.query.tiktok_username;
  console.log(`🎮 Client connected: ${socket.id} (username: ${clientUsername || 'none'})`);
  
  // If client provides a username, connect to TikTok with it
  if (clientUsername) {
    initTikTokConnection(clientUsername);
  }
  
  socket.on('disconnect', () => {
    console.log(`👋 Client disconnected: ${socket.id}`);
  });
  
  // Allow clients to request connection status
  socket.on('requestStatus', () => {
    socket.emit('status', {
      tiktokConnected: tiktokConnection?.connected || false,
      username: tiktokConnection?.uniqueId || clientUsername || TIKTOK_USERNAME || 'simulation-mode'
    });
  });
});

// Try to initialize TikTok connection from .env if available
if (TIKTOK_USERNAME) {
  initTikTokConnection(TIKTOK_USERNAME);
}

// Start server
httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     🎃 Halloween Battle - TikTok Live Server 🦇       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Mode: ${NODE_ENV}`);
  console.log(`🔗 Client origin: ${CLIENT_ORIGIN}`);
  console.log(`📡 TikTok: ${TIKTOK_USERNAME || 'simulation-mode'}`);
  console.log('');
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Status API: http://localhost:${PORT}/api/status`);
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  if (tiktokConnection) {
    tiktokConnection.disconnect();
  }
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
