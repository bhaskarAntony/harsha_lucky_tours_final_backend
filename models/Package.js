// models/Package.js
import mongoose from 'mongoose';

const winnerSchema = new mongoose.Schema({
  name: String,
  virtualCardNumber: String,
  city: String,
  phone: String,
  feedbackVideo: String,
  feedbackMessage: String,
  chosenPrize: String, // manual text if you want to store what winner finally took
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'l_User'
  }
}, { _id: false });

const packageSchema = new mongoose.Schema({
  packageId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true
  },
  destination: [{
    type: String,
    required: true
  }],
  couples: {
    type: Number,
    required: true,
    min: 1
  },
  duration: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  description: {
    type: String,
    required: true
  },
  inclusions: [{
    type: String,
    required: true
  }],
  drawDate: {
    type: Date,
    required: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  monthlyInstallment: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'current', 'draw_completed'],
    default: 'upcoming'
  },
  liveVideoUrl: {
    type: String,
    default: ''
  },

  // NEW: free manual text admin can type anything
  prizeDescription: {
    type: String,
    default: '' // e.g. "BABA BAIDYANATH DHAM (1 FAMILY 4 PERSONS) OR 75K WORTH GOLD OR SILVER ORNAMENTS"
  },

  winner: winnerSchema,

  totalParticipants: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate package ID automatically if not provided
packageSchema.pre('save', async function(next) {
  if (!this.packageId) {
    const count = await mongoose.model('l_Package').countDocuments();
    this.packageId = `PKG${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('l_Package', packageSchema);
