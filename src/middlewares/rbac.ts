import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { UserRole } from '../types/user.types';

/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Restricts access to routes based on user roles
 * Must be used AFTER authentication middleware
 * 
 * Usage:
 * router.post('/meetings', authenticate, requireRole([UserRole.ORGANIZER]), createMeeting)
 */

/**
 * Require specific role(s) to access route
 * 
 * @param allowedRoles - Array of roles that can access the route
 * @returns Express middleware function
 * 
 * Example:
 * requireRole([UserRole.ORGANIZER]) - Only organizers
 * requireRole([UserRole.ORGANIZER, UserRole.PARTICIPANT]) - Both roles
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated (should be set by authenticate middleware)
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Check if user's role is in the allowed roles
      const userRole = req.user.role as UserRole;
      
      if (!allowedRoles.includes(userRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
          userRole: userRole,
        });
        return;
      }

      // User has required role, proceed
      next();
    } catch (error: any) {
      console.error('Role check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message,
      });
    }
  };
};

/**
 * Require ORGANIZER role
 * 
 * Convenience middleware for routes that only organizers can access
 * 
 * Usage:
 * router.post('/meetings', authenticate, requireOrganizer, createMeeting)
 */
export const requireOrganizer = requireRole([UserRole.ORGANIZER]);

/**
 * Require PARTICIPANT role (or higher)
 * 
 * Convenience middleware for routes that require at least participant role
 * Note: Since ORGANIZER is typically "higher" than PARTICIPANT,
 * this allows both roles by default
 * 
 * Usage:
 * router.get('/meetings', authenticate, requireParticipant, getMeetings)
 */
export const requireParticipant = requireRole([
  UserRole.PARTICIPANT,
  UserRole.ORGANIZER,
]);

/**
 * Check if user is the organizer of a specific resource
 * 
 * Generic middleware for checking resource ownership
 * Requires a function that retrieves the resource and checks ownership
 * 
 * @param getResourceOwnerId - Async function that returns the owner's userId
 * @returns Express middleware function
 * 
 * Example:
 * const checkMeetingOwner = requireOwnership(async (req) => {
 *   const meeting = await Meeting.findById(req.params.id);
 *   return meeting?.organizer.toString();
 * });
 * 
 * router.put('/meetings/:id', authenticate, checkMeetingOwner, updateMeeting)
 */
export const requireOwnership = (
  getResourceOwnerId: (req: AuthRequest) => Promise<string | undefined>
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Get resource owner ID
      const ownerId = await getResourceOwnerId(req);

      if (!ownerId) {
        res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
        return;
      }

      // Check if current user is the owner
      if (req.user.userId !== ownerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.',
        });
        return;
      }

      // User is the owner, proceed
      next();
    } catch (error: any) {
      console.error('Ownership check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership verification failed',
        error: error.message,
      });
    }
  };
};

/**
 * Require user to be either the owner OR have a specific role
 * 
 * Useful for routes where admins or the resource owner can access
 * 
 * @param getResourceOwnerId - Function to get resource owner ID
 * @param allowedRoles - Roles that can access regardless of ownership
 * @returns Express middleware function
 * 
 * Example (future admin role):
 * requireOwnershipOrRole(getOwnerId, [UserRole.ADMIN])
 */
export const requireOwnershipOrRole = (
  getResourceOwnerId: (req: AuthRequest) => Promise<string | undefined>,
  allowedRoles: UserRole[]
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userRole = req.user.role as UserRole;

      // Check if user has required role (bypass ownership check)
      if (allowedRoles.includes(userRole)) {
        next();
        return;
      }

      // Check ownership
      const ownerId = await getResourceOwnerId(req);

      if (!ownerId) {
        res.status(404).json({
          success: false,
          message: 'Resource not found',
        });
        return;
      }

      if (req.user.userId !== ownerId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You must be the owner or have proper role.',
        });
        return;
      }

      // User is the owner, proceed
      next();
    } catch (error: any) {
      console.error('Ownership or role check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message,
      });
    }
  };
};

/**
 * Check if user is a participant in a specific meeting
 * 
 * Verifies that the authenticated user is listed as a participant
 * 
 * @param getMeetingParticipants - Function that returns array of participant IDs
 * @returns Express middleware function
 * 
 * Example:
 * const checkIsParticipant = requireParticipation(async (req) => {
 *   const meeting = await Meeting.findById(req.params.id);
 *   return meeting?.participants.map(p => p.toString());
 * });
 * 
 * router.get('/meetings/:id', authenticate, checkIsParticipant, getMeeting)
 */
export const requireParticipation = (
  getMeetingParticipants: (req: AuthRequest) => Promise<string[] | undefined>
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Get meeting participants
      const participants = await getMeetingParticipants(req);

      if (!participants) {
        res.status(404).json({
          success: false,
          message: 'Meeting not found',
        });
        return;
      }

      // Check if current user is in participants list
      const isParticipant = participants.includes(req.user.userId);

      if (!isParticipant) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You are not a participant in this meeting.',
        });
        return;
      }

      // User is a participant, proceed
      next();
    } catch (error: any) {
      console.error('Participation check middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Participation verification failed',
        error: error.message,
      });
    }
  };
};

/**
 * Combine multiple authorization checks with OR logic
 * 
 * Allows access if ANY of the middleware functions passes
 * 
 * @param middlewares - Array of authorization middleware functions
 * @returns Express middleware function
 * 
 * Example:
 * const canViewMeeting = anyOf([
 *   requireOwnership(getOwnerId),
 *   requireParticipation(getParticipants)
 * ]);
 * 
 * router.get('/meetings/:id', authenticate, canViewMeeting, getMeeting)
 */
export const anyOf = (
  middlewares: Array<(req: AuthRequest, res: Response, next: NextFunction) => void>
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    let lastError: any = null;

    for (const middleware of middlewares) {
      try {
        let passed = false;

        // Create a mock next that sets passed = true
        const mockNext = () => {
          passed = true;
        };

        // Create a mock res that captures failures
        const mockRes = {
          ...res,
          status: (code: number) => {
            lastError = { code };
            return mockRes;
          },
          json: (data: any) => {
            if (lastError) {
              lastError.message = data.message;
            }
            return mockRes;
          },
        } as Response;

        await middleware(req, mockRes, mockNext as NextFunction);

        if (passed) {
          next();
          return;
        }
      } catch (error) {
        lastError = error;
      }
    }

    // None of the middlewares passed
    res.status(lastError?.code || 403).json({
      success: false,
      message: lastError?.message || 'Access denied',
    });
  };
};
