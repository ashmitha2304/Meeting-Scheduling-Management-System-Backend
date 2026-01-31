import { Response } from 'express';
import { AuthRequest } from '../types/express';
import { userService } from '../services/userService';
import { UserRole } from '../types/user.types';

/**
 * User Controller
 * 
 * HTTP request handlers for user-related endpoints
 * Delegates business logic to UserService
 */

/**
 * Get all active users
 * 
 * GET /api/users
 * Query: { role? }
 * Returns: Array of users
 * Status: 200 OK | 401 Unauthorized
 * 
 * Used for participant selection in meeting creation
 */
export const getAllUsers = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const roleFilter = req.query.role as UserRole | undefined;
    const users = await userService.getAllUsers(roleFilter);

    return res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message,
    });
  }
};

/**
 * Get users by specific role
 * 
 * GET /api/users/by-role/:role
 * Params: { role }
 * Returns: Array of users with specified role
 * Status: 200 OK | 400 Bad Request | 401 Unauthorized
 */
export const getUsersByRole = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { role } = req.params;

    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`,
      });
    }

    const users = await userService.getAllUsers(role as UserRole);

    return res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length,
        role,
      },
    });
  } catch (error: any) {
    console.error('Get users by role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message,
    });
  }
};
