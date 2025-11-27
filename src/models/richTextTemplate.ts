import mongoose, { Schema, model, models } from 'mongoose';

/**
 * RichTextTemplate Model
 * For storing rich text form templates used by Division YP
 * Supports division-specific templates, user history, and template sharing
 */

const TemplateUsageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    usedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TemplateMetadataSchema = new Schema(
  {
    wordCount: { type: Number, default: 0 },
    hasImages: { type: Boolean, default: false },
    hasTables: { type: Boolean, default: false },
    characterCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const RichTextTemplateSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 200 },
    description: { type: String, maxlength: 500 },
    division: { type: String, required: true }, // "Energy Division A"
    state: { type: String, required: true }, // "Uttar Pradesh"
    htmlContent: { type: String, required: true }, // Raw HTML from Tiptap editor
    thumbnailUrl: { type: String }, // Preview image URL
    isDefault: { type: Boolean, default: false }, // Division default template
    isShared: { type: Boolean, default: false }, // Shared across divisions
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastUsedBy: { type: [TemplateUsageSchema], default: [] }, // Track usage history
    version: { type: Number, default: 1 }, // Template version number
    metadata: { type: TemplateMetadataSchema, default: {} },
    tags: { type: [String], default: [] }, // ["quarterly", "energy", "capacity"]
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    favoriteCount: { type: Number, default: 0 }, // How many users favorited this
  },
  { timestamps: true }
);

// Indexes for efficient querying
RichTextTemplateSchema.index({ division: 1, state: 1, status: 1 });
RichTextTemplateSchema.index({ createdBy: 1 });
RichTextTemplateSchema.index({ tags: 1 });
RichTextTemplateSchema.index({ 'lastUsedBy.userId': 1, 'lastUsedBy.usedAt': -1 });

// Method to update usage
RichTextTemplateSchema.methods.recordUsage = function(userId: mongoose.Types.ObjectId) {
  const existingUsage = this.lastUsedBy.find(
    (u: any) => u.userId.toString() === userId.toString()
  );
  
  if (existingUsage) {
    existingUsage.usedAt = new Date();
  } else {
    this.lastUsedBy.push({ userId, usedAt: new Date() });
  }
  
  return this.save();
};

export type RichTextTemplateDoc = mongoose.InferSchemaType<typeof RichTextTemplateSchema> & {
  _id: mongoose.Types.ObjectId;
  recordUsage: (userId: mongoose.Types.ObjectId) => Promise<any>;
};

export const RichTextTemplate =
  models.RichTextTemplate || model('RichTextTemplate', RichTextTemplateSchema);
