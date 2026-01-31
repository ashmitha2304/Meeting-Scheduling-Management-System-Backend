import Joi from 'joi';
import { UserRole } from '../types/user.types';
import { MeetingStatus } from '../types/meeting.types';

/**
 * Validation Schemas using Joi
 * 
 * Provides input validation for all API endpoints
 * Prevents invalid data from reaching business logic layer
 */

/**
 * Auth Validation Schemas
 */

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'any.required': 'Password is required',
    }),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required',
    }),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required',
    }),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional()
    .default(UserRole.PARTICIPANT)
    .messages({
      'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
    }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required',
    }),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required',
    }),
  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'any.required': 'New password is required',
    }),
});

/**
 * Meeting Validation Schemas
 */

export const createMeetingSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .required()
    .trim()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required',
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .trim()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters',
    }),
  participantIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid participant ID format',
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one participant is required',
      'any.required': 'Participants are required',
    }),
  startTime: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Start time must be a valid date',
      'any.required': 'Start time is required',
    }),
  endTime: Joi.date()
    .iso()
    .greater(Joi.ref('startTime'))
    .required()
    .messages({
      'date.base': 'End time must be a valid date',
      'date.greater': 'End time must be after start time',
      'any.required': 'End time is required',
    }),
  location: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .trim()
    .messages({
      'string.max': 'Location cannot exceed 200 characters',
    }),
  meetingLink: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Meeting link must be a valid URL',
    }),
});

export const updateMeetingSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .optional()
    .trim()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 200 characters',
    }),
  description: Joi.string()
    .max(2000)
    .optional()
    .allow('')
    .trim()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters',
    }),
  participantIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid participant ID format',
        })
    )
    .min(1)
    .optional()
    .messages({
      'array.min': 'At least one participant is required',
    }),
  startTime: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Start time must be a valid date',
    }),
  endTime: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'End time must be a valid date',
    }),
  location: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .trim()
    .messages({
      'string.max': 'Location cannot exceed 200 characters',
    }),
  meetingLink: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Meeting link must be a valid URL',
    }),
  status: Joi.string()
    .valid(...Object.values(MeetingStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(MeetingStatus).join(', ')}`,
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const getMeetingsQuerySchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(MeetingStatus))
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(MeetingStatus).join(', ')}`,
    }),
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date',
    }),
  endDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'End date must be a valid date',
    }),
});

export const mongoIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required',
    }),
});

/**
 * Participant Assignment Schemas
 */

export const assignParticipantsSchema = Joi.object({
  participantIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid participant ID format',
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one participant ID is required',
      'any.required': 'participantIds array is required',
    }),
});

export const removeParticipantsSchema = Joi.object({
  participantIds: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.pattern.base': 'Invalid participant ID format',
        })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one participant ID is required',
      'any.required': 'participantIds array is required',
    }),
});
