/**
 * @fileoverview Main application entry point for Real-Time Polling API
 * 
 * This file sets up the Express.js server with Socket.IO for real-time communication.
 * Implements security middleware, CORS, rate limiting, and graceful shutdown handling.
 * 
 * Architecture:
 * - Express.js for RESTful API endpoints
 * - Socket.IO for real-time WebSocket communication  
 * - Helmet for security headers
 * - Rate limiting for DDoS protection
 * - Comprehensive error handling
 * 
 * @author Move37 Ventures Developer
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import pollRoutes from './routes/pollRoutes';
import voteRoutes from './routes/voteRoutes'; 

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { setupWebSocket } from './websocket/socketHandler';

// Import controllers for Socket.IO integration
import { PollController } from './controllers/pollController';
import { VoteController } from './controllers/voteController';

// Load environment variables first to ensure configuration is available
dotenv.config();

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

/**
 * HTTP server instance for hosting both Express and Socket.IO
 * @type {http.Server}
 */
const server = createServer(app);

/**
 * Socket.IO server instance for real-time communication
 * Configured with CORS to allow cross-origin WebSocket connections
 * @type {Server}
 */
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'] // Fallback to polling if WebSocket fails
});

/**
 * Integrate Socket.IO with controllers for real-time features
 * This allows controllers to emit real-time updates when data changes
 */
PollController.setSocketIO(io);
VoteController.setSocketIO(io);

// ================================
// SECURITY & MIDDLEWARE SETUP
// ================================

/**
 * Helmet security middleware
 * Adds various HTTP headers to help secure the application
 * crossOriginEmbedderPolicy disabled for Socket.IO compatibility
 */
app.use(helmet({
  crossOriginEmbedderPolicy: false
}));

/**
 * CORS (Cross-Origin Resource Sharing) middleware
 * Allows specified origins to access the API
 * Configured from environment variables for flexibility
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP address
 * Configurable via environment variables
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); 
app.use('/api/polls', pollRoutes);
app.use('/api', voteRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Real-time Polling API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint - Welcome page
app.get('/', (req, res) => {
  res.json({
    message: '🗳️ Real-time Polling API',
    description: 'A robust API for creating and managing real-time polls with WebSocket support',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    links: {
      documentation: '/api',
      health: '/health',
      polls: '/api/polls'
    },
    features: [
      'User authentication with JWT',
      'Real-time poll updates via WebSocket',
      'Poll creation and management',
      'Vote tracking and results',
      'Rate limiting and security middleware'
    ]
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Real-time Polling API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        profile: 'GET /api/auth/me'
      },
      polls: {
        create: 'POST /api/polls',
        list: 'GET /api/polls',
        get: 'GET /api/polls/:id',
        update: 'PUT /api/polls/:id',
        delete: 'DELETE /api/polls/:id',
        publish: 'PUT /api/polls/:id/publish',
        results: 'GET /api/polls/:id/results'
      },
      votes: {
        submit: 'POST /api/polls/:pollId/vote',
        myVote: 'GET /api/polls/:pollId/my-vote',
        myVotes: 'GET /api/votes/my-votes'
      }
    }
  });
});

// 404 handlers
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.originalUrl} not found`
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found', 
    message: `Route ${req.originalUrl} not found`
  });
});

// Setup WebSocket
setupWebSocket(io);

// Error handling (must be last)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('🚀 ================================');
  console.log('🚀 Real-time Polling API Server');
  console.log('🚀 ================================');
  console.log(`📍 Server: http://${HOST}:${PORT}`);
  console.log(`📚 API Docs: http://${HOST}:${PORT}/api`);
  console.log(`💚 Health: http://${HOST}:${PORT}/health`);
  console.log(`🔌 WebSocket ready for real-time updates`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🚀 ================================');
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n📡 Received ${signal}. Shutting down gracefully...`);

  server.close((err) => {
    if (err) {
      console.error('❌ Error during shutdown:', err);
      process.exit(1);
    }
    console.log('✅ Server closed successfully');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('⚠️  Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
