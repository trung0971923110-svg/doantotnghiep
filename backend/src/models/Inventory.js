import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['cpu', 'mainboard', 'ram', 'vga', 'psu', 'ssd', 'case', 'camera', 'dvr', 'hdd', 'cable', 'accessories']
  },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  minStock: { type: Number, default: 0, min: 0 },
  specs: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
export default Inventory;
