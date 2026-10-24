
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const User = require('../Models/User');

// GET MY PROFILE
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -phone');

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      message: 'Profile fetched successfully.',
      user
    });
  } catch (err) {
    console.error('Get Profile Error:', err.message);

    return res.status(500).json({
      message: 'Unable to fetch profile.'
    });
  }
});

// UPDATE MY PROFILE
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          message: 'Name cannot be empty.'
        });
      }

      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          message: 'A valid email is required.'
        });
      }

      updates.email = email.trim().toLowerCase();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'Provide a name or email to update.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -phone');

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'This email is already registered.'
      });
    }

    console.error('Update Profile Error:', err.message);

    return res.status(
      err.name === 'ValidationError' ? 400 : 500
    ).json({
      message:
        err.name === 'ValidationError'
          ? err.message
          : 'Unable to update profile.'
    });
  }
});

module.exports = router;