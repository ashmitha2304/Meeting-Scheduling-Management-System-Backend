import express from 'express';
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
  changePassword,
} from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

/**
 * Authentication Routes
 * 
 * All routes related to user authentication and account management
 * Base path: /api/auth
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, firstName, lastName, role? }
 * @returns { accessToken, refreshToken, user }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login existing user
 * @access  Public
 * @body    { email, password }
 * @returns { accessToken, refreshToken, user }
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 * @returns { accessToken, refreshToken }
 */
router.post('/refresh', refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 * @headers Authorization: Bearer <token>
 * @returns { user }
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private (requires authentication)
 * @headers Authorization: Bearer <token>
 * @returns { message }
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private (requires authentication)
 * @headers Authorization: Bearer <token>
 * @body    { oldPassword, newPassword }
 * @returns { message }
 */
router.post('/change-password', authenticate, changePassword);

export default router;
