import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserDetails,
  getAllPayments,
  createPayment,
  updatePayment,
  deletePayment,
  sendMessage,
  getMessages
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Payments
router.get('/payments', getAllPayments);
router.post('/payments', createPayment);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

// Messages
router.get('/messages', getMessages);
router.post('/messages', sendMessage);

export default router;