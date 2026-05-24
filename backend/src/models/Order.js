import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  customerAddress: { type: String, required: true, trim: true },
  totalPrice: { type: Number, required: true, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled'],
    default: 'pending'
  },
  details: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    price: { type: Number, required: true, min: 0 } // Price at the time of purchase
  }]
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
