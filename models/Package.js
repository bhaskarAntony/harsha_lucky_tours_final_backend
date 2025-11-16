import mongoose from 'mongoose';

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
  winner: {
    name: String,
    virtualCardNumber: String,
    city: String,
    phone: String,
    feedbackVideo: String,
    feedbackMessage: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'l_User'
    }
  },
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

// Generate package ID
packageSchema.pre('save', async function(next) {
  if (!this.packageId) {
    const count = await mongoose.model('l_Package').countDocuments();
    this.packageId = `PKG${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('l_Package', packageSchema);