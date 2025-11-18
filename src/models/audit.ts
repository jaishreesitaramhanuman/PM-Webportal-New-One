import mongoose, { Schema, model, models } from 'mongoose'

const AuditSchema = new Schema(
  {
    action: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    ts: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export type AuditDoc = mongoose.InferSchemaType<typeof AuditSchema> & { _id: mongoose.Types.ObjectId }

export const Audit = models.Audit || model('Audit', AuditSchema)