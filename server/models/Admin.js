import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { adminRoles } from './constants.js';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid admin email']
    },
    password: {
      type: String,
      required: [true, 'Admin password is required'],
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: adminRoles,
      default: 'admin'
    }
  },
  {
    timestamps: true
  }
);

adminSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

adminSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
