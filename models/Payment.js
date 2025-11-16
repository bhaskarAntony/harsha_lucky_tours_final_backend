import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'l_User',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'l_Package',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    enum: ['UPI', 'Cash', 'Card', 'Bank Transfer'],
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
  paymentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  transactionId: {
    type: String,
    unique: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generate transaction ID
paymentSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString();
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    this.transactionId = `TXN${timestamp}${randomNum}`;
  }
  next();
});

export default mongoose.model('l_Payment', paymentSchema);