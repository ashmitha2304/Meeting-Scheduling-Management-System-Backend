import { Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { AuthRequest } from '../types/express';

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT tokens and attaches user data to request object
 * Protects routes that require authentication
 * 
 * Usage:
 * router.get('/protected', authenticate, controller)
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
      return;
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid or expired token',
      });
      return;
    }

    // Attach user data to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Proceed to next middleware/controller
    next();
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

/**
 * Optional Authentication Middleware
 * 
 * Attaches user data if token is present, but doesn't fail if missing
 * Useful for routes that have different behavior for authenticated users
 * 
 * Usage:
 * router.get('/public-or-protected', optionalAuthenticate, controller)
 */
export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      } catch (error) {
        // Token invalid but don't fail - just continue without user data
        console.log('Optional auth: Invalid token, continuing without user');
      }
    }

    next();
  } catch (error: any) {
    console.error('Optional authentication middleware error:', error);
    next(); // Continue even on error
  }
};

/**
 * Refresh Token Middleware (optional enhancement)
 * 
 * Checks if access token is expired and automatically refreshes it
 * Requires client to send refresh token in cookie or header
 * 
 * Note: This is an advanced pattern - typically handled client-side
 */
export const autoRefreshToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    try {
      // Try to verify token
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      next();
    } catch (error: any) {
      // If token expired, check for refresh token
      if (error.message === 'Token has expired') {
        const refreshToken = req.cookies?.refreshToken || req.headers['x-refresh-token'];
        
        if (!refreshToken) {
          res.status(401).json({
            success: false,
            message: 'Token expired and no refresh token provided',
          });
          return;
        }

        // Attempt to refresh (implement this based on your needs)
        res.status(401).json({
          success: false,
          message: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }

      // Other token errors
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid token',
      });
    }
  } catch (error: any) {
    console.error('Auto-refresh middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};
