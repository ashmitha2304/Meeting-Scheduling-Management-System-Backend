import { Response } from 'express';
import { authService } from '../services/authService';
import { RegisterDTO, LoginDTO } from '../types/auth.types';
import { AuthRequest } from '../types/express';

/**
 * Authentication Controller
 * 
 * Handles HTTP requests for authentication endpoints
 * Delegates business logic to AuthService
 * Returns consistent JSON responses with proper status codes
 */

/**
 * Register a new user
 * 
 * POST /api/auth/register
 * Body: { email, password, firstName, lastName, role? }
 * Returns: { accessToken, refreshToken, user }
 * Status: 201 Created | 400 Bad Request | 409 Conflict
 */
export const register = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const registerDto: RegisterDTO = req.body;

    // Basic validation
    if (!registerDto.email || !registerDto.password || !registerDto.firstName || !registerDto.lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required',
      });
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(registerDto.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Password strength validation
    if (registerDto.password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Register user
    const authResponse = await authService.register(registerDto);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: authResponse,
    });
  } catch (error: any) {
    // Handle duplicate email error
    if (error.message === 'Email already registered') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

/**
 * Login existing user
 * 
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { accessToken, refreshToken, user }
 * Status: 200 OK | 400 Bad Request | 401 Unauthorized
 */
export const login = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const loginDto: LoginDTO = req.body;

    // Basic validation
    if (!loginDto.email || !loginDto.password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Attempt login
    const authResponse = await authService.login(loginDto);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: authResponse,
    });
  } catch (error: any) {
    // Handle authentication errors
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

/**
 * Refresh access token
 * 
 * POST /api/auth/refresh
 * Body: { refreshToken }
 * Returns: { accessToken, refreshToken }
 * Status: 200 OK | 400 Bad Request | 401 Unauthorized
 */
export const refreshToken = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Generate new token pair
    const tokens = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  } catch (error: any) {
    // Handle invalid/expired token errors
    if (error.message.includes('Invalid refresh token') || 
        error.message.includes('User not found')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message,
    });
  }
};

/**
 * Get current user profile (protected route)
 * 
 * GET /api/auth/me
 * Headers: { Authorization: Bearer <token> }
 * Returns: { user }
 * Status: 200 OK | 401 Unauthorized
 * 
 * Note: Requires authentication middleware
 */
export const getCurrentUser = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // User data attached by authentication middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Fetch complete user profile
    const userProfile = await authService.getUserProfile(req.user.userId);

    return res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      error: error.message,
    });
  }
};

/**
 * Logout user (client-side token removal)
 * 
 * POST /api/auth/logout
 * Headers: { Authorization: Bearer <token> }
 * Returns: { message }
 * Status: 200 OK
 * 
 * Note: Since JWT is stateless, logout is primarily handled client-side
 * For enhanced security, implement token blacklisting with Redis
 */
export const logout = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // In a stateless JWT system, logout is handled by client removing tokens
    // For production, consider implementing token blacklisting:
    // 1. Store token in Redis blacklist with TTL = token expiration
    // 2. Check blacklist in authentication middleware
    // 3. Reject requests with blacklisted tokens

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message,
    });
  }
};

/**
 * Change password (protected route)
 * 
 * POST /api/auth/change-password
 * Headers: { Authorization: Bearer <token> }
 * Body: { oldPassword, newPassword }
 * Returns: { message }
 * Status: 200 OK | 400 Bad Request | 401 Unauthorized
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { oldPassword, newPassword } = req.body;

    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    // Change password
    await authService.changePassword(req.user.userId, oldPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    if (error.message === 'Current password is incorrect') {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};
