import mongoose from 'mongoose';

const editRequestSchema = new mongoose.Schema(
  {
    sop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SOP',
      required: true,
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reason: {
      type: String,
      required: true,
    },
    responseMessage: String,
  },
  { timestamps: true }
);

editRequestSchema.index({ sop: 1 });
editRequestSchema.index({ status: 1 });

const EditRequest = mongoose.models.EditRequest || mongoose.model('EditRequest', editRequestSchema);
export default EditRequest;
