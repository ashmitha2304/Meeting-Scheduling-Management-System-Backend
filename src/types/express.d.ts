import { Request, Response } from 'express';

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
