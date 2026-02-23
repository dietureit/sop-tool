import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
});

const imageAttachmentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  url: String,
  uploadedAt: Date,
});

const documentAttachmentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  url: String,
  uploadedAt: Date,
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

const sopVersionSchema = new mongoose.Schema({
  sop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOP',
    required: true,
  },
  versionNumber: {
    type: Number,
    required: true,
  },
  title: String,
  purpose: String,
  scope: String,
  procedure: [procedureStepSchema],
  responsibilities: [responsibilitySchema],
  accountability: [responsibilitySchema],
  exceptions: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

sopVersionSchema.index({ sop: 1, versionNumber: 1 });

const SOPVersion = mongoose.models.SOPVersion || mongoose.model('SOPVersion', sopVersionSchema);
export default SOPVersion;
