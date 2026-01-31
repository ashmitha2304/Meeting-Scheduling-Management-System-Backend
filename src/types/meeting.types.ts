// @ts-nocheck
import { Document, Types } from 'mongoose';
import { IUser } from './user.types';

// Meeting status enum
export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Meeting interface for type safety
export interface IMeeting extends Document {
  _id: string;
  title: string;
  description?: string;
  organizer: Types.ObjectId | IUser;
  participants: Types.ObjectId[] | IUser[];
  startTime: Date;
  endTime: Date;
  location?: string;
  meetingLink?: string;
  status: MeetingStatus;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual fields
  duration: number; // in minutes
  
  // Instance methods
  hasConflict(userId: Types.ObjectId, start: Date, end: Date): Promise<boolean>;
  isOrganizer(userId: string | Types.ObjectId): boolean;
  isParticipant(userId: string | Types.ObjectId): boolean;
}

// Meeting creation payload
export interface CreateMeetingDTO {
  title: string;
  description?: string;
  participantIds: string[];
  startTime: Date | string;
  endTime: Date | string;
  location?: string;
  meetingLink?: string;
}

// Meeting update payload
export interface UpdateMeetingDTO {
  title?: string;
  description?: string;
  participantIds?: string[];
  startTime?: Date | string;
  endTime?: Date | string;
  location?: string;
  meetingLink?: string;
  status?: MeetingStatus;
}

// Conflict check result
export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingMeetings?: IMeeting[];
  conflictingUsers?: string[];
}
