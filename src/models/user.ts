import mongoose, { Schema, model, models } from 'mongoose';

/**
 * User Model (SRS Section 4.2 User Model)
 * Supports RBAC with role, state, and branch claims.
 * Traceability: FR-01 (login), FR-02 (RBAC middleware).
 */
const RoleAssignmentSchema = new Schema(
  {
    role: { type: String, required: true },
    state: { type: String },
    branch: { type: String }, // aka division
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String },
    roles: { type: [RoleAssignmentSchema], default: [] },
    state: { type: String },
    branch: { type: String },
    status: { type: String, enum: ['pending', 'active'], default: 'pending' },
  },
  { timestamps: true }
);

export type UserDoc = mongoose.InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User = models.User || model('User', UserSchema);