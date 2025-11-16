import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'both'],
    required: true
  },
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'l_User',
      required: true
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending'
    },
    sentAt: Date,
    error: String
  }],
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'l_User',
    required: true
  },
  totalRecipients: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('l_Message', messageSchema);