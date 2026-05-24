import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, default: 0, min: 0 },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'discontinued'], 
    default: 'active' 
  },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} } // For custom attributes like socket, ramType, wattage, etc.
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);
