import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import roomRoutes from './routes/roomRoutes.js';
import { initializeSocket } from './sockets/roomSocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, postman, curl)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in deployment to avoid blocking multiplayer invitations
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', roomRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'wordshift-backend'
  });
});

// Initialize Socket.IO event handlers
initializeSocket(io);

// Start server
async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 WORDSHIFT backend server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO listening for real-time room events`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export { app, server, io };
