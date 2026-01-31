import { UserRole } from './user.types';

/**
 * JWT Payload structure
 * Data stored in the JWT token (should be minimal and non-sensitive)
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number; // Issued at (timestamp)
  exp?: number; // Expiration (timestamp)
}

/**
 * Login credentials
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Registration payload
 */
export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole; // Optional, defaults to PARTICIPANT
}

/**
 * Authentication response sent to client
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

/**
 * Refresh token payload
 */
export interface RefreshTokenDTO {
  refreshToken: string;
}

/**
 * Token pair
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
