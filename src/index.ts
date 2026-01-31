import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { env } from './config/env';

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
    console.error('❌ MongoDB connection error:', error);
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
  console.error('❌ MongoDB connection error:', error);
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

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// API routes (will be added)
app.get('/api', (_req, res) => {
  res.json({
    message: 'Meeting Scheduler API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      meetings: '/api/meetings',
    },
  });
});

// Import routes when they exist
try {
  const authRoutes = require('./routes/authRoutes').default;
  const meetingRoutes = require('./routes/meetingRoutes').default;
  const userRoutes = require('./routes/userRoutes').default;
  
  app.use('/api/auth', authRoutes);
  app.use('/api/meetings', meetingRoutes);
  app.use('/api/users', userRoutes);
} catch (error) {
  console.log('⚠️  Routes not yet implemented');
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n🚀 Server started successfully!');
  console.log(`📡 Backend running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
  console.log('\nPress Ctrl+C to stop the server\n');
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
