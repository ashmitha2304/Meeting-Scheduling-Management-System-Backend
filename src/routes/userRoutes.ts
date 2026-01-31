import express from 'express';
import { getAllUsers, getUsersByRole } from '../controllers/userController';
import { authenticate } from '../middlewares/auth';

const router = express.Router();

/**
 * User Routes
 * 
 * Routes for user management and retrieval
 * Base path: /api/users
 */

/**
 * @route   GET /api/users
 * @desc    Get all active users (for participant selection)
 * @access  Private (authenticated users)
 * @headers Authorization: Bearer <token>
 * @query   role? - Filter by role (ORGANIZER, PARTICIPANT)
 * @returns { users: User[] }
 */
router.get('/', authenticate, getAllUsers);

/**
 * @route   GET /api/users/by-role/:role
 * @desc    Get users by specific role
 * @access  Private (authenticated users)
 * @headers Authorization: Bearer <token>
 * @params  role - User role (ORGANIZER | PARTICIPANT)
 * @returns { users: User[] }
 */
router.get('/by-role/:role', authenticate, getUsersByRole);

export default router;
