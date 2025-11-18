import mongoose, { Schema, model, models } from 'mongoose'

const StateReportSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'WorkflowRequest', required: true },
    state: { type: String, required: true },
    divisionFormIds: { type: [Schema.Types.ObjectId], ref: 'FormSubmission', default: [] },
    compiledData: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    audit: {
      type: [
        new Schema(
          { action: String, userId: { type: Schema.Types.ObjectId, ref: 'User' }, ts: { type: Date, default: Date.now }, notes: String },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
)

export type StateReportDoc = mongoose.InferSchemaType<typeof StateReportSchema> & { _id: mongoose.Types.ObjectId }

export const StateReport = models.StateReport || model('StateReport', StateReportSchema)