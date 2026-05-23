import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'technician', 'customer'], required: true },
  name: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
