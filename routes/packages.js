import express from 'express';
import {
  getAllPackages,
  getCurrentPackage,
  createPackage,
  updatePackage,
  deletePackage,
  updateCurrentPackage,
  getPackageDetails
} from '../controllers/packageController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllPackages);
router.get('/current', getCurrentPackage);
router.get('/:id', getPackageDetails);

// Protected admin routes
router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.post('/', createPackage);
router.put('/:id', updatePackage);
router.delete('/:id', deletePackage);
router.put('/current/update', updateCurrentPackage);

export default router;