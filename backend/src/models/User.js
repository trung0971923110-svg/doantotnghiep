import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }, // acts as passwordHash
  name: { type: String, required: true }, // acts as fullName
  email: { type: String, trim: true, lowercase: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  role: { 
    type: String, 
    enum: ['admin', 'technician', 'customer'], 
    default: 'customer',
    required: true 
  }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;
