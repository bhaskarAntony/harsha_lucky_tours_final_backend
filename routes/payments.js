import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Payment from '../models/pendingPayment.js';
import User from '../models/User.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().populate('userId', 'name email phone');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Import payments from Excel
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const payments = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        const email = row.email || row.Email;
        
        // Find user by email
        const user = await User.findOne({ email: email });
        if (!user) {
          errors.push({ row: i + 1, error: `User with email ${email} not found` });
          continue;
        }

        const paymentData = {
          userId: user._id,
          email: user.email,
          phone: user.phone,
          amount: parseFloat(row.amount || row.Amount),
          dueDate: new Date(row.dueDate || row['Due Date']),
          status: row.status || row.Status || 'pending',
          description: row.description || row.Description || ''
        };

        const payment = new Payment(paymentData);
        await payment.save();
        payments.push(payment);
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    res.json({
      message: `Imported ${payments.length} payments successfully`,
      imported: payments.length,
      errors: errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending payments
router.get('/pending', async (req, res) => {
  try {
    const pendingPayments = await Payment.find({ status: 'pending' }).populate('userId', 'name email phone');
    res.json(pendingPayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment status
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;