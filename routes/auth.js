  import express from 'express';
  import { body } from 'express-validator';
  import {
    register,
    login,
    getMe,
    updateProfile,
    changePassword
  } from '../controllers/authController.js';
  import { protect } from '../middleware/auth.js';

  const router = express.Router();

  // Validation rules
  const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('phone').isMobilePhone().withMessage('Please provide a valid phone number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('city').notEmpty().withMessage('City is required')
  ];

  const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ];

  // Routes
  router.post('/register', registerValidation, register);
  router.post('/login', loginValidation, login);
  router.get('/me', protect, getMe);
  router.put('/profile', protect, updateProfile);
  router.put('/change-password', protect, changePassword);

  export default router;