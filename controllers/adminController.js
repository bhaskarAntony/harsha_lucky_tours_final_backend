import User from '../models/User.js';
import Package from '../models/Package.js';
import Payment from '../models/Payment.js';
import Message from '../models/Message.js';
import sendEmail from '../utils/sendEmail.js';
import sendSMS from '../utils/sendSMS.js';

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalPackages = await Package.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAmountCollected = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const currentPackage = await Package.findOne({ status: 'current' });
    
    const recentPayments = await Payment.find()
      .populate('userId', 'name virtualCardNumber')
      .populate('packageId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentPackages = await Package.find({ status: 'draw_completed' })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentWinners = await Package.find({ 
      status: 'draw_completed',
      'winner.name': { $exists: true }
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalPackages,
          totalUsers,
          totalAmountCollected: totalAmountCollected[0]?.total || 0,
          currentPackage: currentPackage ? {
            name: currentPackage.name,
            month: currentPackage.month,
            year: currentPackage.year,
            totalParticipants: currentPackage.totalParticipants,
            totalRevenue: currentPackage.totalRevenue
          } : null
        },
        recentPayments,
        recentPackages,
        recentWinners
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

// Users Management
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { virtualCardNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
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

export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, city, address, dateOfBirth } = req.body;

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
    const virtualCardNumber = `HLT-${year}-${randomNum}`;

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

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        virtualCardNumber: user.virtualCardNumber,
        city: user.city
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

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, city, address, dateOfBirth, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, phone, city, address, dateOfBirth, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    const payments = await Payment.find({ userId: id })
      .populate('packageId', 'name month year')
      .sort({ createdAt: -1 });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        payments
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

// Payments Management
export const getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const payments = await Payment.find()
      .populate('userId', 'name virtualCardNumber phone')
      .populate('packageId', 'name month year')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        payments,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
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

export const createPayment = async (req, res) => {
  try {
    const { userId, packageId, amount, paymentMode, month, year, notes } = req.body;

    const user = await User.findById(userId);
    const packageData = await Package.findById(packageId);

    if (!user || !packageData) {
      return res.status(404).json({
        success: false,
        message: 'User or Package not found'
      });
    }

    const payment = await Payment.create({
      userId,
      packageId,
      amount,
      paymentMode,
      month,
      year,
      notes
    });

    // Update user's payment stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 
        totalAmountPaid: amount,
        monthsPaid: 1
      }
    });

    // Update package stats
    await Package.findByIdAndUpdate(packageId, {
      $inc: {
        totalParticipants: 1,
        totalRevenue: amount
      }
    });

    // Send SMS and Email
    try {
      const smsMessage = `Dear ${user.name}, your payment of ₹${amount} for ${packageData.name} has been received successfully. Transaction ID: ${payment.transactionId}`;
      await sendSMS(user.phone, smsMessage);

      const emailHtml = `
        <h2>Payment Confirmation</h2>
        <p>Dear ${user.name},</p>
        <p>Your payment has been received successfully!</p>
        <p><strong>Details:</strong></p>
        <ul>
          <li>Package: ${packageData.name}</li>
          <li>Amount: ₹${amount}</li>
          <li>Month: ${month} ${year}</li>
          <li>Transaction ID: ${payment.transactionId}</li>
          <li>Payment Mode: ${paymentMode}</li>
        </ul>
        <p>Thank you for choosing Lucky Tours!</p>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Payment Confirmation - Lucky Tours',
        html: emailHtml
      });

    } catch (notificationError) {
      console.error('Notification Error:', notificationError);
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('userId', 'name virtualCardNumber phone')
      .populate('packageId', 'name month year');

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      payment: populatedPayment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMode, month, year, status, notes } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      id,
      { amount, paymentMode, month, year, status, notes },
      { new: true, runValidators: true }
    ).populate('userId', 'name virtualCardNumber phone')
     .populate('packageId', 'name month year');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByIdAndDelete(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Send Messages
export const sendMessage = async (req, res) => {
  try {
    const { title, message, type, userIds } = req.body;

    const messageDoc = await Message.create({
      title,
      message,
      type,
      sentBy: req.user.id,
      totalRecipients: userIds.length,
      recipients: userIds.map(userId => ({ userId }))
    });

    // Send messages to users
    const users = await User.find({ _id: { $in: userIds } });
    
    for (const user of users) {
      try {
        if (type === 'email' || type === 'both') {
          await sendEmail({
            email: user.email,
            subject: title,
            html: `<p>${message}</p>`
          });
        }

        if (type === 'sms' || type === 'both') {
          await sendSMS(user.phone, message);
        }

        // Update recipient status
        await Message.findOneAndUpdate(
          { _id: messageDoc._id, 'recipients.userId': user._id },
          { 
            $set: { 
              'recipients.$.status': 'sent',
              'recipients.$.sentAt': new Date()
            },
            $inc: { successCount: 1 }
          }
        );

      } catch (error) {
        // Update recipient status as failed
        await Message.findOneAndUpdate(
          { _id: messageDoc._id, 'recipients.userId': user._id },
          { 
            $set: { 
              'recipients.$.status': 'failed',
              'recipients.$.error': error.message
            },
            $inc: { failureCount: 1 }
          }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Messages sent successfully',
      messageId: messageDoc._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('sentBy', 'name')
      .populate('recipients.userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};