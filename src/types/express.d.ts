// Type augmentation for Express Request to include authenticated user data
import { Request } from 'express';

/**
 * Augment Express namespace to add user property to Request
 * This allows TypeScript to recognize req.user after authentication middleware
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Custom AuthRequest interface for typed route handlers
 * Use this in controller functions for better type safety
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}
