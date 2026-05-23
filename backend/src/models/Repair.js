import mongoose from 'mongoose';

const HistoryEntrySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' }
}, { _id: false });

const PartUsedSchema = new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  name: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }
}, { _id: false });

const RepairSchema = new mongoose.Schema({
  repairCode: { type: String, unique: true }, // e.g. REP-1001
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  deviceType: {
    type: String,
    required: true,
    enum: ['pc', 'laptop', 'printer', 'camera', 'other']
  },
  deviceName: { type: String, default: 'Thiết bị không rõ model' },
  issueDescription: { type: String, required: true },
  status: {
    type: String,
    enum: ['received', 'inspecting', 'fixing', 'completed'],
    default: 'received'
  },
  assignedTechId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  history: { type: [HistoryEntrySchema], default: [] },
  partsUsed: { type: [PartUsedSchema], default: [] },
  serviceFee: { type: Number, default: 150000 },
  totalPrice: { type: Number, default: 150000 }
}, { timestamps: true });

// Auto-generate repairCode before saving
RepairSchema.pre('save', async function (next) {
  if (!this.repairCode) {
    const last = await mongoose.model('Repair').findOne({}, {}, { sort: { createdAt: -1 } });
    let num = 1001;
    if (last && last.repairCode) {
      const match = last.repairCode.match(/\d+/);
      if (match) num = parseInt(match[0]) + 1;
    }
    this.repairCode = `REP-${num}`;
  }
  next();
});

export default mongoose.model('Repair', RepairSchema);
