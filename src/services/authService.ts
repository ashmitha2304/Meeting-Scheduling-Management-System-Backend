import User from '../models/User';
import {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  TokenPair,
} from '../types/auth.types';
import { UserRole } from '../types/user.types';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';

/**
 * Authentication Service
 * 
 * Business logic layer for authentication operations
 * Handles user registration, login, and token management
 * Separated from controllers for better testability
 */

export class AuthService {
  /**
   * Register a new user
   * 
   * Process:
   * 1. Check if email already exists
   * 2. Create user (password hashed by User model pre-save hook)
   * 3. Generate JWT tokens
   * 4. Return user data + tokens
   * 
   * @param registerDto - Registration data
   * @returns Authentication response with tokens
   * @throws Error if email already exists
   */
  async register(registerDto: RegisterDTO): Promise<AuthResponse> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create new user (password automatically hashed by pre-save hook)
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: role || UserRole.PARTICIPANT, // Default to PARTICIPANT
    });

    // Generate JWT tokens
    const tokens = generateTokenPair(
      user._id.toString(),
      user.email,
      user.role
    );

    // Return user data without password
    return {
      ...tokens,
      user: {
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Login existing user
   * 
   * Process:
   * 1. Find user by email
   * 2. Verify password using bcrypt
   * 3. Generate JWT tokens
   * 4. Return user data + tokens
   * 
   * @param loginDto - Login credentials
   * @returns Authentication response with tokens
   * @throws Error if credentials are invalid
   */
  async login(loginDto: LoginDTO): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user by email (include password field for verification)
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT tokens
    const tokens = generateTokenPair(
      user._id.toString(),
      user.email,
      user.role
    );

    // Return user data without password
    return {
      ...tokens,
      user: {
        _id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   * 
   * Process:
   * 1. Verify refresh token
   * 2. Find user by ID from token
   * 3. Generate new access token
   * 4. Optionally rotate refresh token (recommended for security)
   * 
   * @param refreshToken - Valid refresh token
   * @returns New token pair
   * @throws Error if refresh token is invalid or user not found
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new token pair (rotate refresh token for security)
    const tokens = generateTokenPair(
      user._id.toString(),
      user.email,
      user.role
    );

    return tokens;
  }

  /**
   * Get user profile by ID
   * 
   * Used by middleware after JWT verification
   * 
   * @param userId - User's MongoDB ObjectId
   * @returns User profile (without password)
   * @throws Error if user not found
   */
  async getUserProfile(userId: string) {
    const user = await User.findById(userId);
    
    if (!user || !user.isActive) {
      throw new Error('User not found');
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Validate user credentials (for middleware)
   * 
   * @param userId - User's MongoDB ObjectId
   * @returns True if user exists and is active
   */
  async validateUser(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    return !!(user && user.isActive);
  }

  /**
   * Change user password (future enhancement)
   * 
   * @param userId - User's MongoDB ObjectId
   * @param oldPassword - Current password
   * @param newPassword - New password
   * @throws Error if old password is incorrect
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();
  }

  /**
   * Deactivate user account (soft delete)
   * 
   * @param userId - User's MongoDB ObjectId
   */
  async deactivateAccount(userId: string): Promise<void> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = false;
    await user.save();
  }
}

// Export singleton instance
export const authService = new AuthService();
