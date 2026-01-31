import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole } from '../types/user.types';

/**
 * User Schema
 * 
 * Stores user authentication and profile information with role-based access control.
 * 
 * Design Decisions:
 * - Unique email for authentication
 * - Password hashed using bcrypt (pre-save hook)
 * - Role field for RBAC (ORGANIZER can create meetings, PARTICIPANT can only attend)
 * - Soft delete with isActive flag
 * - Timestamps for audit trail
 */
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true, // Fast lookups during authentication
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include in queries by default (security)
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: '{VALUE} is not a valid role',
      },
      default: UserRole.PARTICIPANT,
      required: true,
      index: true, // Enable filtering by role
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Fast filtering of active users
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform: (_doc, ret) => {
        // Remove sensitive fields when converting to JSON
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

// Compound index for email + isActive (common query pattern)
userSchema.index({ email: 1, isActive: 1 });

// Index for role-based queries (e.g., get all organizers)
userSchema.index({ role: 1, isActive: 1 });

// ============================================
// PRE-SAVE HOOK - PASSWORD HASHING
// ============================================

userSchema.pre('save', async function () {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return;
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Compare provided password with stored hash
 * Used during login authentication
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

/**
 * Get user profile without sensitive data
 */
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// ============================================
// MODEL EXPORT
// ============================================

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
