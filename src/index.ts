import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { env } from './config/env';
import authRoutes from './routes/authRoutes';
import meetingRoutes from './routes/meetingRoutes';
import userRoutes from './routes/userRoutes';

// Load environment variables
dotenv.config();

const app: Application = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(
  cors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// MONGODB CONNECTION
// ============================================

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error instanceof Error ? error.message : error);
    // In production, log error but don't exit - let health check handle it
    if (env.NODE_ENV === 'production') {
      console.error('⚠️  Running without MongoDB - some features will be unavailable');
    } else {
      process.exit(1);
    }
  }
};

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error instanceof Error ? error.message : error);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Connect to database
connectDB();

// ============================================
// ROUTES
// ============================================

/**
 * Root Route - API Overview
 * GET /
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'Meeting Scheduling Management System - Backend API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    status: 'running',
    documentation: {
      health: '/health',
      api: '/api',
      routes: {
        auth: '/api/auth',
        meetings: '/api/meetings',
        users: '/api/users',
      },
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health Check Route
 * GET /health
 */
app.get('/health', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
  
  res.status(200).json({
    success: true,
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: {
      status: dbStatus,
      name: mongoose.connection.db?.databaseName || 'N/A',
    },
  });
});

/**
 * API Base Route - Available Endpoints
 * GET /api
 */
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Meeting Scheduler API v1.0.0',
    availableRoutes: [
      {
        group: 'Authentication',
        basePath: '/api/auth',
        endpoints: [
          'POST /api/auth/register',
          'POST /api/auth/login',
          'POST /api/auth/refresh',
          'GET /api/auth/me',
          'POST /api/auth/logout',
          'POST /api/auth/change-password',
        ],
      },
      {
        group: 'Meetings',
        basePath: '/api/meetings',
        endpoints: [
          'POST /api/meetings',
          'GET /api/meetings',
          'GET /api/meetings/my-meetings',
          'GET /api/meetings/schedule',
          'GET /api/meetings/:id',
          'PUT /api/meetings/:id',
          'DELETE /api/meetings/:id',
          'PATCH /api/meetings/:id/cancel',
          'POST /api/meetings/:id/participants',
          'DELETE /api/meetings/:id/participants',
        ],
      },
      {
        group: 'Users',
        basePath: '/api/users',
        endpoints: [
          'GET /api/users',
          'GET /api/users/:id',
        ],
      },
    ],
  });
});

/**
 * API Route Handlers
 */
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users', userRoutes);

/**
 * 404 Handler - Route Not Found
 * Must be placed AFTER all valid routes
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableEndpoints: {
      root: '/',
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      meetings: '/api/meetings',
      users: '/api/users',
    },
  });
});

/**
 * Global Error Handler
 * Must be placed LAST
 */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Error:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('🚀 Server started successfully');
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`💚 Health: /health`);
  console.log(`📚 API Info: /api`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default app;
