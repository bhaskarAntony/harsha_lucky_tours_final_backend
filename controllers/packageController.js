// controllers/packageController.js
import Package from '../models/Package.js';
import User from '../models/User.js';

// Get all packages
export const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });

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

// Get current package
export const getCurrentPackage = async (req, res) => {
  try {
    const currentPackage = await Package.findOne({ status: 'current' });

    res.status(200).json({
      success: true,
      data: currentPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Create package
export const createPackage = async (req, res) => {
  try {
    const {
      name,
      destination,
      couples,
      duration,
      images,
      description,
      inclusions,
      drawDate,
      month,
      year,
      monthlyInstallment,
      packageId,
      prizeDescription // NEW
    } = req.body;

    const pkg = await Package.create({
      name,
      destination,
      couples: Number(couples),
      duration,
      images,
      description,
      inclusions,
      drawDate,
      month,
      year: Number(year),
      monthlyInstallment: Number(monthlyInstallment),
      packageId,
      prizeDescription: prizeDescription || ''
    });

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: pkg
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

// Update package
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.couples != null) {
      updateData.couples = Number(updateData.couples);
    }
    if (updateData.monthlyInstallment != null) {
      updateData.monthlyInstallment = Number(updateData.monthlyInstallment);
    }
    if (updateData.year != null) {
      updateData.year = Number(updateData.year);
    }

    const pkg = await Package.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Package updated successfully',
      data: pkg
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

// Delete package
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await Package.findByIdAndDelete(id);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Update current package (live link + winner info + optional chosenPrize text)
export const updateCurrentPackage = async (req, res) => {
  try {
    const { liveVideoUrl, winnerId, feedbackMessage, feedbackVideo, chosenPrize } = req.body;

    const currentPackage = await Package.findOne({ status: 'current' });

    if (!currentPackage) {
      return res.status(404).json({
        success: false,
        message: 'No current package found'
      });
    }

    const updateData = {};

    if (liveVideoUrl) {
      updateData.liveVideoUrl = liveVideoUrl;
    }

    if (winnerId) {
      const winner = await User.findById(winnerId);
      if (!winner) {
        return res.status(404).json({
          success: false,
          message: 'Winner not found'
        });
      }

      updateData.winner = {
        name: winner.name,
        virtualCardNumber: winner.virtualCardNumber,
        city: winner.city,
        phone: winner.phone,
        feedbackMessage: feedbackMessage || '',
        feedbackVideo: feedbackVideo || '',
        chosenPrize: chosenPrize || '',
        userId: winnerId
      };
      updateData.status = 'draw_completed';
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      currentPackage._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Current package updated successfully',
      data: updatedPackage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Get single package
export const getPackageDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await Package.findById(id);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.status(200).json({
      success: true,
      data: pkg
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};
