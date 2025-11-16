import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  virtualCardNumber: {
    type: String,
    unique: true,
    required: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  branch: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalAmountPaid: {
    type: Number,
    default: 0
  },
  monthsPaid: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate virtual card number
// userSchema.pre('save', async function(next) {
//   if (!this.virtualCardNumber) {
//     const year = new Date().getFullYear();
//     const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
//     this.virtualCardNumber = `HLT-${year}-${randomNum}`;
//   }
//   next();
// });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('l_User', userSchema);