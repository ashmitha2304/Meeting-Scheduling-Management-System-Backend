import { Request } from 'express';

/**
 * Extended Express Request interface with user data
 * Attached by authentication middleware after JWT verification
 */
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Ensure Express namespace is augmented
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
