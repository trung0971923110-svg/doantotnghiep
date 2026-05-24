import mongoose from 'mongoose';

const RecommendationRuleSchema = new mongoose.Schema({
  need: { type: mongoose.Schema.Types.ObjectId, ref: 'Need', required: true, unique: true },
  minCPUCore: { type: Number, default: 4, min: 2 },
  minRAM: { type: Number, default: 8, min: 4 }, // in GB
  requireVGA: { type: Boolean, default: false },
  priorityComponent: { 
    type: String, 
    enum: ['cpu', 'ram', 'vga', 'mainboard', 'psu', 'ssd', 'case'], 
    required: true 
  },
  budgetDistribution: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {
      cpu: 0.30,
      ram: 0.10,
      mainboard: 0.15,
      vga: 0.25,
      psu: 0.08,
      ssd: 0.07,
      case: 0.05
    }
  }
}, { timestamps: true });

export default mongoose.model('RecommendationRule', RecommendationRuleSchema);
