import { Response } from 'express';
import { meetingService } from '../services/meetingService';
import { CreateMeetingDTO, UpdateMeetingDTO, MeetingStatus } from '../types/meeting.types';
import { AuthRequest } from '../types/express';
import { UserRole } from '../types/user.types';

/**
 * Meeting Controller
 * 
 * HTTP request handlers for meeting management
 * Delegates business logic to MeetingService
 */

/**
 * Create a new meeting
 * 
 * POST /api/meetings
 * Headers: { Authorization: Bearer <token> }
 * Body: { title, description?, participantIds, startTime, endTime, location?, meetingLink? }
 * Returns: Created meeting with populated participants
 * Status: 201 Created | 400 Bad Request | 403 Forbidden | 409 Conflict
 * 
 * Requires: Authentication + ORGANIZER role
 */
export const createMeeting = async (
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

    const meetingDto: CreateMeetingDTO = req.body;
    const organizerId = req.user.userId;

    // Create meeting with conflict detection
    const meeting = await meetingService.createMeeting(meetingDto, organizerId);

    return res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: meeting,
    });
  } catch (error: any) {
    console.error('Create meeting error:', error);

    // Handle specific errors
    if (error.message.includes('conflict')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes('not found') ||
      error.message.includes('inactive') ||
      error.message.includes('time') ||
      error.message.includes('duration') ||
      error.message.includes('past')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create meeting',
      error: error.message,
    });
  }
};

/**
 * Get meetings (role-based)
 * 
 * GET /api/meetings
 * Headers: { Authorization: Bearer <token> }
 * Query: { status?, startDate?, endDate? }
 * Returns: Array of meetings
 * Status: 200 OK | 401 Unauthorized
 * 
 * Behavior:
 * - ORGANIZER: Returns meetings they created
 * - PARTICIPANT: Returns meetings they're invited to
 */
export const getMeetings = async (
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

    const { status, startDate, endDate } = req.query;

    const filters: any = {};
    if (status) filters.status = status as MeetingStatus;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    let meetings;

    if (req.user.role === UserRole.ORGANIZER) {
      // Organizers see meetings they created
      meetings = await meetingService.getOrganizerMeetings(
        req.user.userId,
        filters
      );
    } else {
      // Participants see meetings they're invited to
      meetings = await meetingService.getParticipantMeetings(
        req.user.userId,
        filters
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        meetings,
        count: meetings.length,
        role: req.user.role,
      },
    });
  } catch (error: any) {
    console.error('Get meetings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve meetings',
      error: error.message,
    });
  }
};

/**
 * Get single meeting by ID
 * 
 * GET /api/meetings/:id
 * Headers: { Authorization: Bearer <token> }
 * Returns: Meeting details
 * Status: 200 OK | 403 Forbidden | 404 Not Found
 * 
 * Note: Requires user to be a participant in the meeting
 */
export const getMeetingById = async (
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

    const { id } = req.params;

    const meeting = await meetingService.getMeetingById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found',
      });
    }

    // Check if user is a participant
    const isParticipant = meeting.participants.some(
      (p: any) => p._id.toString() === req.user!.userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this meeting.',
      });
    }

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error: any) {
    console.error('Get meeting by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve meeting',
      error: error.message,
    });
  }
};

/**
 * Update meeting
 * 
 * PUT /api/meetings/:id
 * Headers: { Authorization: Bearer <token> }
 * Body: { title?, description?, participantIds?, startTime?, endTime?, location?, meetingLink?, status? }
 * Returns: Updated meeting
 * Status: 200 OK | 400 Bad Request | 403 Forbidden | 404 Not Found | 409 Conflict
 * 
 * Note: Only the meeting organizer can update
 */
export const updateMeeting = async (
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

    const { id } = req.params;
    const updateDto: UpdateMeetingDTO = req.body;

    const meeting = await meetingService.updateMeeting(
      id,
      updateDto,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: meeting,
    });
  } catch (error: any) {
    console.error('Update meeting error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('organizer') || error.message.includes('completed')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('conflict')) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('time') || error.message.includes('participants')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      error: error.message,
    });
  }
};

/**
 * Delete meeting
 * 
 * DELETE /api/meetings/:id
 * Headers: { Authorization: Bearer <token> }
 * Returns: Success message
 * Status: 200 OK | 403 Forbidden | 404 Not Found
 * 
 * Note: Only the meeting organizer can delete
 */
export const deleteMeeting = async (
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

    const { id } = req.params;

    await meetingService.deleteMeeting(id, req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete meeting error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('organizer')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to delete meeting',
      error: error.message,
    });
  }
};

/**
 * Cancel meeting (soft delete alternative)
 * 
 * PATCH /api/meetings/:id/cancel
 * Headers: { Authorization: Bearer <token> }
 * Returns: Updated meeting with CANCELLED status
 * Status: 200 OK | 403 Forbidden | 404 Not Found
 */
export const cancelMeeting = async (
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

    const { id } = req.params;

    const meeting = await meetingService.cancelMeeting(id, req.user.userId);

    return res.status(200).json({
      success: true,
      message: 'Meeting cancelled successfully',
      data: meeting,
    });
  } catch (error: any) {
    console.error('Cancel meeting error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('organizer')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to cancel meeting',
      error: error.message,
    });
  }
};

/**
 * Get user's schedule
 * 
 * GET /api/meetings/schedule
 * Headers: { Authorization: Bearer <token> }
 * Query: { startDate, endDate }
 * Returns: Array of meetings in date range
 * Status: 200 OK | 400 Bad Request
 */
export const getUserSchedule = async (
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

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date',
      });
    }

    const meetings = await meetingService.getUserSchedule(
      req.user.userId,
      start,
      end
    );

    return res.status(200).json({
      success: true,
      data: {
        meetings,
        count: meetings.length,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Get user schedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve schedule',
      error: error.message,
    });
  }
};

/**
 * Assign participants to a meeting with strict conflict detection
 * 
 * POST /api/meetings/:id/assign
 * Headers: { Authorization: Bearer <token> }
 * Body: { participantIds: string[] }
 * Returns: Updated meeting with new participants
 * Status: 200 OK | 400 Bad Request | 403 Forbidden | 404 Not Found | 409 Conflict
 * 
 * Business Rules:
 * - Only organizer can assign participants
 * - Participants must not have overlapping meetings
 * - Conflict detection uses MongoDB queries (not in-memory)
 * - Meeting must not be cancelled or completed
 */
export const assignParticipants = async (
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

    const { id } = req.params;
    const { participantIds } = req.body;

    // Validate participantIds
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'participantIds must be a non-empty array',
      });
    }

    // Assign participants with conflict detection
    const result = await meetingService.assignParticipants(
      id,
      participantIds,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${participantIds.length} participant(s) to the meeting`,
      data: {
        meeting: result.meeting,
        assignedCount: participantIds.length,
        conflictDetection: {
          method: 'MongoDB Query',
          strategy: 'Pre-assignment conflict check using compound index',
          query: {
            participants: { $in: 'participantIds' },
            _id: { $ne: 'meetingId' },
            startTime: { $lt: 'meeting.endTime' },
            endTime: { $gt: 'meeting.startTime' },
            status: { $ne: 'CANCELLED' },
          },
        },
      },
    });
  } catch (error: any) {
    console.error('Assign participants error:', error);

    // Handle specific error cases
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes('organizer') ||
      error.message.includes('cancelled') ||
      error.message.includes('completed')
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('conflict')) {
      return res.status(409).json({
        success: false,
        message: 'Scheduling conflict detected',
        details: error.message,
        conflictDetection: {
          method: 'MongoDB Query (Database-Level)',
          notInMemory: true,
          indexUsed: '{ participants: 1, startTime: 1, endTime: 1 }',
          overlapLogic: 'startTime < meeting.endTime AND endTime > meeting.startTime',
        },
      });
    }

    if (
      error.message.includes('inactive') ||
      error.message.includes('already in this meeting')
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to assign participants',
      error: error.message,
    });
  }
};

/**
 * Remove participants from a meeting
 * 
 * POST /api/meetings/:id/remove
 * Headers: { Authorization: Bearer <token> }
 * Body: { participantIds: string[] }
 * Returns: Updated meeting
 * Status: 200 OK | 400 Bad Request | 403 Forbidden | 404 Not Found
 * 
 * Business Rules:
 * - Only organizer can remove participants
 * - Cannot remove the organizer
 * - At least one participant must remain
 */
export const removeParticipants = async (
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

    const { id } = req.params;
    const { participantIds } = req.body;

    // Validate participantIds
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'participantIds must be a non-empty array',
      });
    }

    const meeting = await meetingService.removeParticipants(
      id,
      participantIds,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      message: `Successfully removed ${participantIds.length} participant(s) from the meeting`,
      data: meeting,
    });
  } catch (error: any) {
    console.error('Remove participants error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes('organizer') ||
      error.message.includes('at least one participant')
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to remove participants',
      error: error.message,
    });
  }
};

/**
 * Get meetings for authenticated participant
 * 
 * GET /api/meetings/my-meetings
 * Headers: { Authorization: Bearer <token> }
 * Query: { status?, startDate?, endDate? }
 * Returns: Array of meetings the user is assigned to
 * Status: 200 OK | 401 Unauthorized
 * 
 * Requires: Authentication (PARTICIPANT or ORGANIZER role)
 * 
 * Use Case:
 * - PARTICIPANT users can view their assigned meetings
 * - Shows meetings where user is in participants array
 * - Supports filtering by status and date range
 * 
 * MongoDB Query:
 * ```
 * Meeting.find({
 *   participants: userId  // Uses multikey index on participants array
 * })
 * .populate('organizer', 'firstName lastName email role')
 * .populate('participants', 'firstName lastName email role')
 * .sort({ startTime: 1 })
 * ```
 */
export const getMyMeetings = async (
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

    const userId = req.user.userId;
    
    // Extract optional filters from query
    const filters: any = {};
    
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }

    const meetings = await meetingService.getMyMeetings(userId, filters);

    return res.status(200).json({
      success: true,
      message: `Found ${meetings.length} meeting(s)`,
      data: {
        meetings,
        count: meetings.length,
        userId,
        filters: req.query,
      },
    });
  } catch (error: any) {
    console.error('Get my meetings error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve meetings',
      error: error.message,
    });
  }
};
