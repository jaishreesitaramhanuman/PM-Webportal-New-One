import mongoose, { Schema, model, models } from 'mongoose';

/**
 * FormSubmission Model
 * Traceability: FR-08 (submit), FR-09 (review), FR-10 (approve), FR-11 (merge)
 */
const AttachmentSchema = new Schema(
  {
    filename: { type: String, required: true },
    storageRef: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const FormSubmissionSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'WorkflowRequest', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template' }, // Optional for rich-text forms
    templateMode: { type: String, required: true },
    branch: { type: String },
    state: { type: String },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    data: { type: Schema.Types.Mixed, required: true },
    // NEW: Rich text form support
    formType: { type: String, enum: ['json', 'rich-text'], default: 'json' },
    richTextContent: { type: String }, // HTML content from Tiptap editor
    richTextTemplateId: { type: Schema.Types.ObjectId, ref: 'RichTextTemplate' },
    attachments: { type: [AttachmentSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected', 'merged'],
      default: 'submitted',
    },
    audit: {
      type: [
        new Schema(
          {
            action: { type: String, required: true },
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            ts: { type: Date, default: Date.now },
            notes: { type: String },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export type FormSubmissionDoc =
  mongoose.InferSchemaType<typeof FormSubmissionSchema> & {
    _id: mongoose.Types.ObjectId;
  };

export const FormSubmission =
  models.FormSubmission || model('FormSubmission', FormSubmissionSchema);