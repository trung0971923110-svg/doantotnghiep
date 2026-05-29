import mongoose from 'mongoose';

const NeedSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }
}, { timestamps: true });

const Need = mongoose.models.Need || mongoose.model('Need', NeedSchema);
export default Need;
