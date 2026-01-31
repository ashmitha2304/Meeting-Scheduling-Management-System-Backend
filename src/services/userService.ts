import User from '../models/User';
import { IUser, UserRole } from '../types/user.types';

/**
 * User Service
 * 
 * Business logic for user-related operations
 * Handles user retrieval and management
 */

export class UserService {
  /**
   * Get all active users, optionally filtered by role
   * 
   * Used for:
   * - Participant selection in meeting creation
   * - User directory/listing
   * 
   * @param role - Optional role filter (ORGANIZER | PARTICIPANT)
   * @returns Array of users (without sensitive data)
   */
  async getAllUsers(role?: UserRole): Promise<IUser[]> {
    const query: any = { isActive: true };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password') // Exclude password field
      .sort({ firstName: 1, lastName: 1 }) // Alphabetical order
      .lean();

    return users as IUser[];
  }

  /**
   * Get user by ID
   * 
   * @param userId - User ID
   * @returns User profile or null if not found
   */
  async getUserById(userId: string): Promise<IUser | null> {
    const user = await User.findById(userId)
      .select('-password')
      .lean();

    return user as IUser | null;
  }

  /**
   * Search users by name or email
   * 
   * @param searchTerm - Search query
   * @returns Array of matching users
   */
  async searchUsers(searchTerm: string): Promise<IUser[]> {
    const users = await User.find({
      isActive: true,
      $or: [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ],
    })
      .select('-password')
      .sort({ firstName: 1, lastName: 1 })
      .limit(20)
      .lean();

    return users as IUser[];
  }
}

// Export singleton instance
export const userService = new UserService();
