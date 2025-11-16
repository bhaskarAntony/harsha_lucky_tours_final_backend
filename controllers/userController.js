import Payment from '../models/Payment.js';
import Package from '../models/Package.js';

// Get user dashboard data
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's payments
    const payments = await Payment.find({ userId })
      .populate('packageId', 'name month year')
      .sort({ createdAt: -1 });

    // Get current package
    const currentPackage = await Package.findOne({ status: 'current' });

    // Calculate next draw date (28th of current month)
    const now = new Date();
    const nextDrawDate = new Date(now.getFullYear(), now.getMonth(), 28);
    if (nextDrawDate < now) {
      nextDrawDate.setMonth(nextDrawDate.getMonth() + 1);
    }

    // Get user stats
    const totalAmountPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const monthsPaid = payments.length;

    res.status(200).json({
      success: true,
      data: {
        monthsPaid,
        totalAmountPaid,
        currentPackage,
        nextDrawDate,
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

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findOne({ _id: id, userId })
      .populate('packageId', 'name month year destination duration');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get all packages for lucky draw playground
export const getPackagesForPlayground = async (req, res) => {
  try {
    const packages = await Package.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: packages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get live videos
export const getLiveVideos = async (req, res) => {
  try {
    const packages = await Package.find({
      liveVideoUrl: { $exists: true, $ne: '' }
    }).sort({ createdAt: -1 });

    const videos = packages.map(pkg => ({
      id: pkg._id,
      title: pkg.name,
      videoUrl: pkg.liveVideoUrl,
      month: pkg.month,
      year: pkg.year
    }));

    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};