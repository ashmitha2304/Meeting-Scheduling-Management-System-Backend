// @ts-nocheck
import { Types } from 'mongoose';
import Meeting from '../models/Meeting';
import User from '../models/User';
import {
  CreateMeetingDTO,
  UpdateMeetingDTO,
  IMeeting,
  MeetingStatus,
  ConflictCheckResult,
} from '../types/meeting.types';
import { UserRole } from '../types/user.types';

/**
 * Meeting Service
 * 
 * Business logic for meeting management with conflict detection
 * Handles meeting creation, retrieval, updates, and deletion
 */

export class MeetingService {
  /**
   * Create a new meeting with conflict detection
   * 
   * Process:
   * 1. Validate all participants exist and are active
   * 2. Check organizer for conflicts
   * 3. Check each participant for conflicts
   * 4. Create meeting if no conflicts
   * 
   * @param meetingDto - Meeting creation data
   * @param organizerId - ID of the user creating the meeting
   * @returns Created meeting with populated participants
   * @throws Error if conflicts found or validation fails
   */
  async createMeeting(
    meetingDto: CreateMeetingDTO,
    organizerId: string
  ): Promise<IMeeting> {
    const {
      title,
      description,
      participantIds,
      startTime,
      endTime,
      location,
      meetingLink,
    } = meetingDto;

    // Convert string dates to Date objects if needed
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate time range
    if (start >= end) {
      throw new Error('End time must be after start time');
    }

    // Validate not in the past
    const now = new Date();
    if (start < now) {
      throw new Error('Cannot create meetings in the past');
    }

    // Validate meeting duration (max 8 hours)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > 8) {
      throw new Error('Meeting duration cannot exceed 8 hours');
    }

    // Validate all participants exist and are active
    const participantObjectIds = participantIds.map((id) => new Types.ObjectId(id));
    const participants = await User.find({
      _id: { $in: participantObjectIds },
      isActive: true,
    });

    if (participants.length !== participantIds.length) {
      throw new Error('One or more participants not found or inactive');
    }

    // Build complete participant list (include organizer)
    const allParticipantIds = [...new Set([organizerId, ...participantIds])];

    // Check for conflicts for ALL participants (including organizer)
    const conflictCheck = await this.checkConflicts(
      allParticipantIds,
      start,
      end
    );

    if (conflictCheck.hasConflict) {
      const conflictDetails = conflictCheck.conflictingMeetings!
        .map((m) => `"${m.title}" (${new Date(m.startTime).toLocaleString()} - ${new Date(m.endTime).toLocaleString()})`)
        .join(', ');
      
      throw new Error(
        `Scheduling conflict detected. Conflicting meetings: ${conflictDetails}`
      );
    }

    // Create meeting
    const meeting = await Meeting.create({
      title,
      description,
      organizer: organizerId,
      participants: allParticipantIds,
      startTime: start,
      endTime: end,
      location,
      meetingLink,
      status: MeetingStatus.SCHEDULED,
    });

    // Return populated meeting
    return await Meeting.findById(meeting._id)
      .populate('organizer', 'firstName lastName email role')
      .populate('participants', 'firstName lastName email role')
      .lean() as IMeeting;
  }

  /**
   * Check for meeting conflicts for multiple users
   * 
   * Uses optimized batch query with compound index
   * 
   * @param userIds - Array of user IDs to check
   * @param startTime - Meeting start time
   * @param endTime - Meeting end time
   * @param excludeMeetingId - Optional meeting ID to exclude (for updates)
   * @returns Conflict check result
   */
  async checkConflicts(
    userIds: string[],
    startTime: Date,
    endTime: Date,
    excludeMeetingId?: string
  ): Promise<ConflictCheckResult> {
    const query: any = {
      participants: { $in: userIds },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      status: { $ne: MeetingStatus.CANCELLED },
    };

    if (excludeMeetingId) {
      query._id = { $ne: excludeMeetingId };
    }

    const conflictingMeetings = await Meeting.find(query)
      .populate('organizer', 'firstName lastName email')
      .populate('participants', 'firstName lastName email')
      .lean();

    if (conflictingMeetings.length > 0) {
      // Extract which users have conflicts
      const conflictingUserIds = new Set<string>();
      conflictingMeetings.forEach((meeting) => {
        meeting.participants.forEach((p: any) => {
          if (userIds.includes(p._id.toString())) {
            conflictingUserIds.add(p._id.toString());
          }
        });
      });

      return {
        hasConflict: true,
        conflictingMeetings: conflictingMeetings as IMeeting[],
        conflictingUsers: Array.from(conflictingUserIds),
      };
    }

    return { hasConflict: false };
  }

  /**
   * Get meetings for a specific organizer
   * 
   * Returns all meetings created by the organizer
   * Sorted by start time (most recent first)
   * 
   * @param organizerId - Organizer's user ID
   * @param filters - Optional filters (status, date range)
   * @returns Array of meetings
   */
  async getOrganizerMeetings(
    organizerId: string,
    filters?: {
      status?: MeetingStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<IMeeting[]> {
    const query: any = { organizer: organizerId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.startTime = {};
      if (filters.startDate) {
        query.startTime.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.startTime.$lte = filters.endDate;
      }
    }

    return await Meeting.find(query)
      .populate('organizer', 'firstName lastName email role')
      .populate('participants', 'firstName lastName email role')
      .sort({ startTime: -1 })
      .lean() as IMeeting[];
  }

  /**
   * Get meetings for a participant
   * 
   * Returns all meetings where user is a participant
   * 
   * @param userId - User's ID
   * @param filters - Optional filters
   * @returns Array of meetings
   */
  async getParticipantMeetings(
    userId: string,
    filters?: {
      status?: MeetingStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<IMeeting[]> {
    const query: any = { participants: userId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.startTime = {};
      if (filters.startDate) {
        query.startTime.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.startTime.$lte = filters.endDate;
      }
    }

    return await Meeting.find(query)
      .populate('organizer', 'firstName lastName email role')
      .populate('participants', 'firstName lastName email role')
      .sort({ startTime: -1 })
      .lean() as IMeeting[];
  }

  /**
   * Get single meeting by ID
   * 
   * @param meetingId - Meeting ID
   * @returns Meeting or null if not found
   */
  async getMeetingById(meetingId: string): Promise<IMeeting | null> {
    return await Meeting.findById(meetingId)
      .populate('organizer', 'firstName lastName email role')
      .populate('participants', 'firstName lastName email role')
      .lean() as IMeeting | null;
  }

  /**
   * Update meeting
   * 
   * Only organizer can update their meetings
   * Checks conflicts if time or participants changed
   * 
   * @param meetingId - Meeting ID
   * @param updateDto - Update data
   * @param userId - User attempting the update
   * @returns Updated meeting
   * @throws Error if user is not organizer or conflicts found
   */
  async updateMeeting(
    meetingId: string,
    updateDto: UpdateMeetingDTO,
    userId: string
  ): Promise<IMeeting> {
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Check if user is the organizer
    if (meeting.organizer.toString() !== userId) {
      throw new Error('Only the meeting organizer can update this meeting');
    }

    // Check if meeting is already completed or cancelled
    if (meeting.status === MeetingStatus.COMPLETED) {
      throw new Error('Cannot update completed meetings');
    }

    // Prepare update data
    const updates: any = {};

    if (updateDto.title !== undefined) updates.title = updateDto.title;
    if (updateDto.description !== undefined) updates.description = updateDto.description;
    if (updateDto.location !== undefined) updates.location = updateDto.location;
    if (updateDto.meetingLink !== undefined) updates.meetingLink = updateDto.meetingLink;
    if (updateDto.status !== undefined) updates.status = updateDto.status;

    // Handle time changes (require conflict check)
    const timeChanged = updateDto.startTime || updateDto.endTime;
    const participantsChanged = updateDto.participantIds;

    if (timeChanged || participantsChanged) {
      const newStart = updateDto.startTime ? new Date(updateDto.startTime) : meeting.startTime;
      const newEnd = updateDto.endTime ? new Date(updateDto.endTime) : meeting.endTime;

      // Validate time range
      if (newStart >= newEnd) {
        throw new Error('End time must be after start time');
      }

      // Build new participant list
      let newParticipantIds: string[];
      if (participantsChanged) {
        // Validate participants exist
        const participantObjectIds = updateDto.participantIds!.map((id) => new Types.ObjectId(id));
        const participants = await User.find({
          _id: { $in: participantObjectIds },
          isActive: true,
        });

        if (participants.length !== updateDto.participantIds!.length) {
          throw new Error('One or more participants not found or inactive');
        }

        newParticipantIds = [...new Set([userId, ...updateDto.participantIds!])];
      } else {
        newParticipantIds = meeting.participants.map((p) => p.toString());
      }

      // Check for conflicts (exclude current meeting)
      const conflictCheck = await this.checkConflicts(
        newParticipantIds,
        newStart,
        newEnd,
        meetingId
      );

      if (conflictCheck.hasConflict) {
        const conflictDetails = conflictCheck.conflictingMeetings!
          .map((m) => `"${m.title}"`)
          .join(', ');
        throw new Error(`Scheduling conflict detected: ${conflictDetails}`);
      }

      updates.startTime = newStart;
      updates.endTime = newEnd;
      if (participantsChanged) {
        updates.participants = newParticipantIds;
      }
    }

    // Apply updates
    Object.assign(meeting, updates);
    await meeting.save();

    // Return populated meeting
    return await Meeting.findById(meetingId)
      .populate('organizer', 'firstName lastName email role')
      .populate('participants', 'firstName lastName email role')
      .lean() as IMeeting;
  }

  /**
   * Delete meeting
   * 
   * Only organizer can delete their meetings
   * 
   * @param meetingId - Meeting ID
   * @param userId - User attempting deletion
   * @throws Error if user is not organizer
   */
  async deleteMeeting(meetingId: string, userId: string): Promise<void> {
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Check if user is the organizer
    if (meeting.organizer.toString() !== userId) {
      throw new Error('Only the meeting organizer can delete this meeting');
    }

    await Meeting.findByIdAndDelete(meetingId);
  }

  /**
   * Cancel meeting (soft delete alternative)
   * 
   * @param meetingId - Meeting ID
   * @param userId - User attempting cancellation
   * @returns Updated meeting with CANCELLED status
   */
  async cancelMeeting(meetingId: string, userId: string): Promise<IMeeting> {
    return await this.updateMeeting(
      meetingId,
      { status: MeetingStatus.CANCELLED },
      userId
    );
  }

  /**
   * Get user's schedule for a date range
   * 
   * @param userId - User ID
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @returns Array of meetings
   */
  async getUserSchedule(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IMeeting[]> {
    return await Meeting.find({
      participants: userId,
      startTime: { $gte: startDate, $lte: endDate },
      status: { $ne: MeetingStatus.CANCELLED },
    })
      .populate('organizer', 'firstName lastName email role')
      .populate('participants', 'firstName lastName email role')
      .sort({ startTime: 1 })
      .lean() as IMeeting[];
  }

  /**
   * Assign participants to an existing meeting with strict conflict detection
   * 
   * Process:
   * 1. Validate meeting exists and user is the organizer
   * 2. Validate all new participants exist and are active
   * 3. Check for conflicts using MongoDB query (NOT in-memory)
   * 4. Add participants only if NO conflicts exist
   * 
   * Overlap Detection Logic:
   * Two meetings overlap if their time ranges intersect:
   * 
   *   Meeting A: [startA, endA]
   *   Meeting B: [startB, endB]
   *   
   *   Overlap when: (startA < endB) AND (endA > startB)
   * 
   * Visual Examples:
   *   Timeline:     10:00        11:00        12:00        13:00
   *   Meeting A:    [----------]                              (10:00-11:00)
   *   Meeting B:              [----------]                    (10:30-11:30) ← CONFLICT (30 min)
   *   Meeting C:                           [----------]       (12:00-13:00) ← NO CONFLICT
   *   Meeting D:    [----------]                              (10:00-11:00) ← CONFLICT (exact overlap)
   *   Meeting E:                 [---]                        (11:00-12:00) ← NO CONFLICT (adjacent)
   * 
   * MongoDB Query Strategy:
   * Uses compound index { participants: 1, startTime: 1, endTime: 1 } for O(log n) performance
   * 
   * @param meetingId - ID of meeting to add participants to
   * @param participantIds - Array of user IDs to assign
   * @param requesterId - ID of user making the request (must be organizer)
   * @returns Updated meeting with new participants
   * @throws Error if conflicts detected or validation fails
   */
  async assignParticipants(
    meetingId: string,
    participantIds: string[],
    requesterId: string
  ): Promise<{
    meeting: IMeeting;
    conflictsDetected: ConflictCheckResult;
  }> {
    // 1. Fetch meeting and validate it exists
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // 2. Verify requester is the organizer
    if (meeting.organizer.toString() !== requesterId) {
      throw new Error('Only the meeting organizer can assign participants');
    }

    // 3. Validate meeting is not cancelled or completed
    if (meeting.status === MeetingStatus.CANCELLED) {
      throw new Error('Cannot assign participants to cancelled meetings');
    }

    if (meeting.status === MeetingStatus.COMPLETED) {
      throw new Error('Cannot assign participants to completed meetings');
    }

    // 4. Validate all participants exist and are active
    const participantObjectIds = participantIds.map((id) => new Types.ObjectId(id));
    const users = await User.find({
      _id: { $in: participantObjectIds },
      isActive: true,
    });

    if (users.length !== participantIds.length) {
      throw new Error('One or more participants not found or inactive');
    }

    // 5. Filter out participants who are already in the meeting
    const existingParticipantIds = meeting.participants.map((p) => p.toString());
    const newParticipantIds = participantIds.filter(
      (id) => !existingParticipantIds.includes(id)
    );

    if (newParticipantIds.length === 0) {
      throw new Error('All specified participants are already in this meeting');
    }

    // 6. CRITICAL: Detect conflicts using MongoDB query (NOT in-memory)
    // 
    // MongoDB Query Explanation:
    // db.meetings.find({
    //   participants: { $in: [newParticipantIds] },      // Any meeting with these participants
    //   _id: { $ne: meetingId },                         // Exclude current meeting
    //   startTime: { $lt: meeting.endTime },             // Meeting starts before current ends
    //   endTime: { $gt: meeting.startTime },             // Meeting ends after current starts
    //   status: { $ne: 'CANCELLED' }                     // Ignore cancelled meetings
    // })
    //
    // Time Overlap Formula Breakdown:
    // - startTime < meeting.endTime: Other meeting starts before current meeting ends
    // - endTime > meeting.startTime: Other meeting ends after current meeting starts
    // - Combined: These two conditions ensure time ranges intersect
    //
    // Performance: Uses compound index for O(log n) lookup
    const conflictingMeetings = await Meeting.find({
      participants: { $in: newParticipantIds },
      _id: { $ne: meetingId },
      startTime: { $lt: meeting.endTime },
      endTime: { $gt: meeting.startTime },
      status: { $ne: MeetingStatus.CANCELLED },
    })
      .populate('organizer', 'firstName lastName email')
      .populate('participants', 'firstName lastName email')
      .lean();

    // 7. If conflicts exist, provide detailed error information
    if (conflictingMeetings.length > 0) {
      // Extract which specific users have conflicts
      const conflictingUserIds = new Set<string>();
      const conflictDetailsMap = new Map<string, any[]>();

      conflictingMeetings.forEach((conflictMeeting: any) => {
        conflictMeeting.participants.forEach((participant: any) => {
          const participantId = participant._id.toString();
          if (newParticipantIds.includes(participantId)) {
            conflictingUserIds.add(participantId);
            
            if (!conflictDetailsMap.has(participantId)) {
              conflictDetailsMap.set(participantId, []);
            }
            
            conflictDetailsMap.get(participantId)!.push({
              meetingId: conflictMeeting._id,
              meetingTitle: conflictMeeting.title,
              startTime: conflictMeeting.startTime,
              endTime: conflictMeeting.endTime,
              participant: participant,
            });
          }
        });
      });

      // Build detailed error message
      const conflictDetails: string[] = [];
      conflictDetailsMap.forEach((conflicts, userId) => {
        const user = users.find(u => u._id.toString() === userId);
        const userName = user ? `${user.firstName} ${user.lastName}` : userId;
        
        const meetingList = conflicts.map(c => 
          `"${c.meetingTitle}" (${new Date(c.startTime).toLocaleString()} - ${new Date(c.endTime).toLocaleString()})`
        ).join(', ');
        
        conflictDetails.push(`${userName}: ${meetingList}`);
      });

      throw new Error(
        `Cannot assign participants due to scheduling conflicts:\n${conflictDetails.join('\n')}`
      );
    }

    // 8. No conflicts - add participants to meeting
    meeting.participants.push(...newParticipantIds.map(id => new Types.ObjectId(id)));
    await meeting.save();

    // 9. Return updated meeting with populated data
    const updatedMeeting = await Meeting.findById(meetingId)
      .populate('organizer', 'firstName lastName email role')
      .populate('participants', 'firstName lastName email role')
      .lean() as IMeeting;

    return {
      meeting: updatedMeeting,
      conflictsDetected: {
        hasConflict: false,
        conflictingMeetings: [],
        conflictingUsers: [],
      },
    };
  }

  /**
   * Remove participants from a meeting
   * 
   * @param meetingId - Meeting ID
   * @param participantIds - Array of user IDs to remove
   * @param requesterId - ID of user making the request (must be organizer)
   * @returns Updated meeting
   * @throws Error if validation fails
   */
  async removeParticipants(
    meetingId: string,
    participantIds: string[],
    requesterId: string
  ): Promise<IMeeting> {
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // Verify requester is the organizer
    if (meeting.organizer.toString() !== requesterId) {
      throw new Error('Only the meeting organizer can remove participants');
    }

    // Cannot remove the organizer
    if (participantIds.includes(requesterId)) {
      throw new Error('Cannot remove the organizer from the meeting');
    }

    // Filter out participants
    meeting.participants = meeting.participants.filter(
      (p) => !participantIds.includes(p.toString())
    );

    // Ensure at least one participant remains
    if (meeting.participants.length === 0) {
      throw new Error('Meeting must have at least one participant');
    }

    await meeting.save();

    return await Meeting.findById(meetingId)
      .populate('organizer', 'firstName lastName email role')
      .populate('participants', 'firstName lastName email role')
      .lean() as IMeeting;
  }

  /**
   * Get all meetings for a participant (PARTICIPANT role)
   * 
   * Returns meetings where the user is in the participants array.
   * This endpoint is specifically for PARTICIPANT role users to view
   * their assigned meetings.
   * 
   * MongoDB Query Strategy:
   * - Uses multikey index on participants array for O(log n) lookup
   * - Filters by participant userId using $in operator
   * - Includes all meeting statuses (SCHEDULED, CANCELLED, COMPLETED)
   * - Populates organizer and participants for full details
   * - Sorts by startTime (earliest first)
   * 
   * Query:
   * ```
   * Meeting.find({
   *   participants: userId  // Uses multikey index
   * })
   * ```
   * 
   * @param userId - ID of the participant
   * @param filters - Optional filters (status, startDate, endDate)
   * @returns Array of meetings the participant is assigned to
   */
  async getMyMeetings(
    userId: string,
    filters?: {
      status?: MeetingStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<IMeeting[]> {
    // Build query
    const query: any = {
      participants: new Types.ObjectId(userId), // User must be in participants array
    };

    // Optional filters
    if (filters?.status) {
      query.status = filters.status;
    }

    // Date range filter
    if (filters?.startDate || filters?.endDate) {
      query.startTime = {};
      if (filters.startDate) {
        query.startTime.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.startTime.$lte = new Date(filters.endDate);
      }
    }

    // Execute MongoDB query with population
    const meetings = await Meeting.find(query)
      .populate('organizer', 'firstName lastName email role')
      .populate('participants', 'firstName lastName email role')
      .sort({ startTime: 1 }) // Sort by start time (earliest first)
      .lean();

    return meetings as IMeeting[];
  }
}

// Export singleton instance
export const meetingService = new MeetingService();
