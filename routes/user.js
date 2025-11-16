import express from 'express';
import {
  getDashboard,
  getPaymentDetails,
  getPackagesForPlayground,
  getLiveVideos
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// User routes
router.get('/dashboard', getDashboard);
router.get('/payments/:id', getPaymentDetails);
router.get('/packages/playground', getPackagesForPlayground);
router.get('/live-videos', getLiveVideos);

export default router;