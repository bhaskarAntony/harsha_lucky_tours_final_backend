import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, "dndyduduihuidhuiwi", {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Register User
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { name, email, phone, password, city, address, dateOfBirth } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or phone'
      });
    }

     const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    const virtualCardNumber = `HLT-${year}-${randomNum}`

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      city,
      address,
      dateOfBirth,
      virtualCardNumber
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        virtualCardNumber: user.virtualCardNumber,
        city: user.city,
        role: user.role
      }
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        virtualCardNumber: user.virtualCardNumber,
        city: user.city,
        role: user.role,
        totalAmountPaid: user.totalAmountPaid,
        monthsPaid: user.monthsPaid
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get Current User
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        virtualCardNumber: user.virtualCardNumber,
        city: user.city,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        role: user.role,
        totalAmountPaid: user.totalAmountPaid,
        monthsPaid: user.monthsPaid
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, city, address, dateOfBirth } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, city, address, dateOfBirth },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        virtualCardNumber: user.virtualCardNumber,
        city: user.city,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};