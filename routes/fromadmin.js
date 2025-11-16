import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import User from '../models/User.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create user manually
router.post('/', async (req, res) => {
  try {
    const userData = { ...req.body };
    
    // Generate password if not provided
    if (!userData.password) {
      userData.password = `${userData.email.split('@')[0]}@123`;
    }
      const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    userData.virtualCardNumber = `HLT-${year}-${randomNum}`;
    
    const user = new User(userData);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Import users from Excel
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const users = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
      
        const userData = {
          name: row.name || row.Name,
          email: row.email || row.Email,
          phone: row.phone || row.Phone,
          city: row.city || row.City,
          address: row.address || row.Address,
          branch: row.branch || row.Branch,
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          password: `${(row.email || row.Email).split('@')[0]}@123`
        };

          const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    userData.virtualCardNumber = `HLT-${year}-${randomNum}`;
        const user = new User(userData);
        await user.save();
        users.push(user);
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }

    res.json({
      message: `Imported ${users.length} users successfully`,
      imported: users.length,
      errors: errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export users to Excel
router.get('/export', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    const exportData = users.map(user => ({
      Name: user.name,
      Email: user.email,
      Phone: user.phone,
      City: user.city,
      Address: user.address,
      Branch: user.branch,
      'Virtual Card Number': user.virtualCardNumber,
      'Date of Birth': user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : '',
      Role: user.role,
      'Is Active': user.isActive,
      'Total Amount Paid': user.totalAmountPaid,
      'Months Paid': user.monthsPaid,
      'Created At': user.createdAt.toISOString().split('T')[0]
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;