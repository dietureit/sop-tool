import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
});

const imageAttachmentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  url: String,
  uploadedAt: { type: Date, default: Date.now },
});

const documentAttachmentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  url: String,
  uploadedAt: { type: Date, default: Date.now },
});

const procedureStepSchema = new mongoose.Schema({
  stepNumber: Number,
  title: String,
  description: String,
  checklist: [checklistItemSchema],
  images: [imageAttachmentSchema],
  documents: [documentAttachmentSchema],
});

const responsibilitySchema = new mongoose.Schema({
  role: String,
  description: String,
});

const sopSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft',
    },
    purpose: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      required: true,
    },
    procedure: [procedureStepSchema],
    responsibilities: [responsibilitySchema],
    accountability: [responsibilitySchema],
    exceptions: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    rejectionReason: String,
    editPermission: {
      type: Boolean,
      default: false,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: Date,
  },
  { timestamps: true }
);

sopSchema.index({ title: 'text', purpose: 'text', scope: 'text' });
sopSchema.index({ status: 1 });
sopSchema.index({ department: 1 });
sopSchema.index({ author: 1 });

const SOP = (mongoose.models.SOP || mongoose.model('SOP', sopSchema)) as mongoose.Model<any>;
export default SOP;
