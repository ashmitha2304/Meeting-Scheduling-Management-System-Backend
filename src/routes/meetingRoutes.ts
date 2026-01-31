import express from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  cancelMeeting,
  getUserSchedule,
  assignParticipants,
  removeParticipants,
  getMyMeetings,
} from '../controllers/meetingController';
import { authenticate } from '../middlewares/auth';
import { requireOrganizer, requireParticipation } from '../middlewares/rbac';
import { validateBody, validateParams, validateQuery, validateMultiple } from '../middlewares/validation';
import {
  createMeetingSchema,
  updateMeetingSchema,
  getMeetingsQuerySchema,
  mongoIdSchema,
  assignParticipantsSchema,
  removeParticipantsSchema,
} from '../validators/schemas';

const router = express.Router();

/**
 * Meeting Routes
 * 
 * All routes require JWT authentication
 * Base path: /api/meetings
 */

/**
 * @route   POST /api/meetings
 * @desc    Create a new meeting with conflict detection
 * @access  Private (ORGANIZER only)
 * @headers Authorization: Bearer <token>
 * @body    { title, description?, participantIds, startTime, endTime, location?, meetingLink? }
 * @returns { meeting }
 */
router.post(
  '/',
  authenticate,
  requireOrganizer,
  validateBody(createMeetingSchema),
  createMeeting
);

/**
 * @route   GET /api/meetings
 * @desc    Get meetings (role-based)
 *          - ORGANIZER: Returns meetings they created
 *          - PARTICIPANT: Returns meetings they're invited to
 * @access  Private (all authenticated users)
 * @headers Authorization: Bearer <token>
 * @query   { status?, startDate?, endDate? }
 * @returns { meetings[], count, role }
 */
router.get(
  '/',
  authenticate,
  validateQuery(getMeetingsQuerySchema),
  getMeetings
);

/**
 * @route   GET /api/meetings/schedule
 * @desc    Get user's schedule for a date range
 * @access  Private (all authenticated users)
 * @headers Authorization: Bearer <token>
 * @query   { startDate, endDate }
 * @returns { meetings[], count, dateRange }
 */
router.get('/schedule', authenticate, getUserSchedule);

/**
 * @route   GET /api/meetings/my-meetings
 * @desc    Get all meetings assigned to authenticated participant
 * @access  Private (PARTICIPANT or ORGANIZER)
 * @headers Authorization: Bearer <token>
 * @query   status? - Filter by meeting status (SCHEDULED, CANCELLED, COMPLETED)
 * @query   startDate? - Filter meetings starting after this date (ISO 8601)
 * @query   endDate? - Filter meetings starting before this date (ISO 8601)
 * @returns { meetings: Meeting[], count: number }
 * 
 * MongoDB Query:
 * Uses multikey index on participants array for O(log n) lookup.
 * Query: { participants: userId }
 * 
 * Use Cases:
 * - PARTICIPANT role: View assigned meetings
 * - ORGANIZER role: View meetings they're participating in (as attendee)
 * - Filter by status to show only upcoming/past meetings
 * - Date range filtering for calendar views
 * 
 * Example:
 * GET /api/meetings/my-meetings?status=SCHEDULED&startDate=2026-02-01
 */
router.get(
  '/my-meetings',
  authenticate,
  getMyMeetings
);

/**
 * @route   GET /api/meetings/:id
 * @desc    Get single meeting details
 * @access  Private (meeting participants only)
 * @headers Authorization: Bearer <token>
 * @params  id - Meeting ID
 * @returns { meeting }
 */
router.get(
  '/:id',
  authenticate,
  validateParams(mongoIdSchema),
  getMeetingById
);

/**
 * @route   PUT /api/meetings/:id
 * @desc    Update meeting (organizer only)
 * @access  Private (meeting organizer only)
 * @headers Authorization: Bearer <token>
 * @params  id - Meeting ID
 * @body    { title?, description?, participantIds?, startTime?, endTime?, location?, meetingLink?, status? }
 * @returns { meeting }
 */
router.put(
  '/:id',
  authenticate,
  validateMultiple({
    params: mongoIdSchema,
    body: updateMeetingSchema,
  }),
  updateMeeting
);

/**
 * @route   PATCH /api/meetings/:id/cancel
 * @desc    Cancel meeting (set status to CANCELLED)
 * @access  Private (meeting organizer only)
 * @headers Authorization: Bearer <token>
 * @params  id - Meeting ID
 * @returns { meeting }
 */
router.patch(
  '/:id/cancel',
  authenticate,
  validateParams(mongoIdSchema),
  cancelMeeting
);

/**
 * @route   DELETE /api/meetings/:id
 * @desc    Delete meeting permanently (organizer only)
 * @access  Private (meeting organizer only)
 * @headers Authorization: Bearer <token>
 * @params  id - Meeting ID
 * @returns { message }
 */
router.delete(
  '/:id',
  authenticate,
  validateParams(mongoIdSchema),
  deleteMeeting
);

/**
 * @route   POST /api/meetings/:id/assign
 * @desc    Assign participants to a meeting with strict conflict detection
 * @access  Private (meeting organizer only)
 * @headers Authorization: Bearer <token>
 * @params  id - Meeting ID
 * @body    { participantIds: string[] }
 * @returns { meeting, assignedCount, conflictDetection }
 * 
 * Conflict Detection:
 * - Uses MongoDB query (NOT in-memory)
 * - Checks for overlapping meetings using: startTime < endTime AND endTime > startTime
 * - Returns 409 Conflict if any participant has overlapping meetings
 */
router.post(
  '/:id/assign',
  authenticate,
  validateMultiple({
    params: mongoIdSchema,
    body: assignParticipantsSchema,
  }),
  assignParticipants
);

/**
 * @route   POST /api/meetings/:id/remove
 * @desc    Remove participants from a meeting
 * @access  Private (meeting organizer only)
 * @headers Authorization: Bearer <token>
 * @params  id - Meeting ID
 * @body    { participantIds: string[] }
 * @returns { meeting }
 */
router.post(
  '/:id/remove',
  authenticate,
  validateMultiple({
    params: mongoIdSchema,
    body: removeParticipantsSchema,
  }),
  removeParticipants
);

export default router;
