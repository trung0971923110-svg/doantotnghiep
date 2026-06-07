import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  name: String,
  qty: { type: Number, default: 1 },
  price: { type: Number, default: 0 }
}, { _id: false });

const CartSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true, unique: true },
  items: { type: [CartItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

CartSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Cart = mongoose.models.Cart || mongoose.model('Cart', CartSchema);
export default Cart;
