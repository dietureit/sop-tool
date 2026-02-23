import mongoose from 'mongoose';

const roleDefinitionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const RoleDefinition = mongoose.models.RoleDefinition || mongoose.model('RoleDefinition', roleDefinitionSchema);
export default RoleDefinition;
