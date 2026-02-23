import mongoose from 'mongoose';

const sopCommentSchema = new mongoose.Schema({
  sop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SOP',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

sopCommentSchema.index({ sop: 1 });

const SOPComment = (mongoose.models.SOPComment || mongoose.model('SOPComment', sopCommentSchema)) as mongoose.Model<any>;
export default SOPComment;
