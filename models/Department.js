import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

departmentSchema.index({ name: 1 }, { unique: true });

const Department = mongoose.models.Department || mongoose.model('Department', departmentSchema);
export default Department;
