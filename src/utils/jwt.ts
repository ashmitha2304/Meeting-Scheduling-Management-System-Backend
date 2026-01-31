// @ts-nocheck
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload, TokenPair } from '../types/auth.types';
import { UserRole } from '../types/user.types';

/**
 * JWT Utility Functions
 * 
 * Handles token generation, verification, and decoding
 * Uses environment variables for secrets and expiration times
 */

/**
 * Generate JWT Access Token
 * 
 * Short-lived token (default: 1 hour) used for API authentication
 * Contains minimal user information for authorization
 * 
 * @param userId - User's MongoDB ObjectId
 * @param email - User's email address
 * @param role - User's role (ORGANIZER | PARTICIPANT)
 * @returns Signed JWT token string
 */
export const generateAccessToken = (
  userId: string,
  email: string,
  role: UserRole
): string => {
  const payload: JwtPayload = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'meeting-scheduler-api',
    audience: 'meeting-scheduler-client',
  });
};

/**
 * Generate JWT Refresh Token
 * 
 * Long-lived token (default: 7 days) used to obtain new access tokens
 * Contains only userId to minimize payload size
 * Should be stored securely (httpOnly cookie recommended)
 * 
 * @param userId - User's MongoDB ObjectId
 * @returns Signed refresh token string
 */
export const generateRefreshToken = (userId: string): string => {
  const payload = { userId };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'meeting-scheduler-api',
    audience: 'meeting-scheduler-client',
  });
};

/**
 * Generate both access and refresh tokens
 * 
 * Convenience function for login/register operations
 * Returns a token pair for immediate use
 * 
 * @param userId - User's MongoDB ObjectId
 * @param email - User's email address
 * @param role - User's role
 * @returns Object containing both tokens
 */
export const generateTokenPair = (
  userId: string,
  email: string,
  role: UserRole
): TokenPair => {
  return {
    accessToken: generateAccessToken(userId, email, role),
    refreshToken: generateRefreshToken(userId),
  };
};

/**
 * Verify and decode JWT Access Token
 * 
 * Validates token signature, expiration, and structure
 * Throws error if token is invalid, expired, or malformed
 * 
 * @param token - JWT token string from Authorization header
 * @returns Decoded JWT payload with user information
 * @throws Error if token is invalid
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'meeting-scheduler-api',
      audience: 'meeting-scheduler-client',
    }) as JwtPayload;

    // Validate required fields exist
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token payload structure');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify and decode JWT Refresh Token
 * 
 * Validates refresh token for generating new access tokens
 * Throws error if token is invalid or expired
 * 
 * @param token - Refresh token string
 * @returns Decoded payload containing userId
 * @throws Error if token is invalid
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'meeting-scheduler-api',
      audience: 'meeting-scheduler-client',
    }) as { userId: string };

    if (!decoded.userId) {
      throw new Error('Invalid refresh token payload');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging/logging)
 * 
 * WARNING: Does NOT verify signature or expiration
 * Use only for non-security-critical operations
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Extract token from Authorization header
 * 
 * Supports "Bearer <token>" format
 * 
 * @param authHeader - Authorization header value
 * @returns Token string or null if invalid format
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Check if token is expired (without verification)
 * 
 * Useful for client-side token refresh logic
 * Does NOT verify signature
 * 
 * @param token - JWT token string
 * @returns True if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp * 1000 < Date.now();
};

/**
 * Get token expiration time
 * 
 * @param token - JWT token string
 * @returns Expiration date or null if invalid
 */
export const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
};
