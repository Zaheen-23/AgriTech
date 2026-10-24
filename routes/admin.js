
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

const router = express.Router();

// Admin authentication — existing JWT system ke saath
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication token missing.',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded._id;

    if (!userId) {
      return res.status(401).json({
        message: 'Invalid authentication token.',
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user || String(user.role).toLowerCase() !== 'admin') {
      return res.status(403).json({
        message: 'Admin access only.',
      });
    }

    req.admin = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
};

// Database collection count helper
async function countCollection(collectionName) {
  try {
    if (!mongoose.connection.db) return 0;

    const collections =
      await mongoose.connection.db.listCollections().toArray();

    const collection = collections.find(
      (item) => item.name.toLowerCase() === collectionName.toLowerCase()
    );

    if (!collection) return 0;

    return await mongoose.connection.db
      .collection(collection.name)
      .countDocuments();
  } catch (error) {
    console.error(`Count error (${collectionName}):`, error.message);
    return 0;
  }
}

// Find a collection using possible names
async function countFirstExistingCollection(names) {
  try {
    if (!mongoose.connection.db) return 0;

    const collections =
      await mongoose.connection.db.listCollections().toArray();

    const collection = collections.find((item) =>
      names.includes(item.name.toLowerCase())
    );

    if (!collection) return 0;

    return await mongoose.connection.db
      .collection(collection.name)
      .countDocuments();
  } catch (error) {
    console.error('Collection count error:', error.message);
    return 0;
  }
}

// GET /api/admin/overview
router.get('/overview', verifyAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      farmers,
      buyers,
      experts,
      products,
      orders,
      soilReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'agriculturalist' }),
      countFirstExistingCollection([
        'products',
        'marketplaceproducts',
      ]),
      countFirstExistingCollection(['orders']),
      countFirstExistingCollection([
        'soilreports',
        'soilanalyses',
        'soilanalysises',
      ]),
    ]);

    let pendingOrders = 0;

    try {
      const collections =
        await mongoose.connection.db.listCollections().toArray();

      const ordersCollection = collections.find(
        (item) => item.name.toLowerCase() === 'orders'
      );

      if (ordersCollection) {
        pendingOrders = await mongoose.connection.db
          .collection(ordersCollection.name)
          .countDocuments({
            status: {
              $in: ['pending', 'Pending', 'processing', 'Processing'],
            },
          });
      }
    } catch (error) {
      console.error('Pending orders error:', error.message);
    }

    // Registered users grouped by month for the analytics chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyUsers = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          value: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const chartData = monthlyUsers.map((item) => ({
      label: `${item._id.month}/${item._id.year}`,
      value: item.value,
    }));

    res.json({
      stats: {
        totalUsers,
        farmers,
        buyers,
        experts,
        products,
        orders,
        pendingOrders,
        soilReports,
      },
      chartData,
    });
  } catch (error) {
    console.error('Admin overview error:', error);

    res.status(500).json({
      message: 'Could not load admin overview.',
    });
  }
});

// GET /api/admin/users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Status defaults to active when no status is saved yet
    const usersWithStatus = users.map((user) => ({
      ...user,
      status: user.status || 'active',
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error('Admin users error:', error);

    res.status(500).json({
      message: 'Could not load users.',
    });
  }
});

// GET /api/admin/activity
// Shows recent account registrations
router.get('/activity', verifyAdmin, async (req, res) => {
  try {
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const activity = recentUsers.map((user) => ({
      _id: user._id,
      title: `${user.name || 'A user'} registered`,
      action: 'New user registration',
      role: user.role,
      createdAt: user.createdAt,
    }));

    res.json({ activity });
  } catch (error) {
    console.error('Admin activity error:', error);

    res.status(500).json({
      message: 'Could not load recent activity.',
    });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid user ID.',
      });
    }

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be active or blocked.',
      });
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    if (String(targetUser.role).toLowerCase() === 'admin') {
      return res.status(403).json({
        message: 'Admin accounts cannot be blocked here.',
      });
    }

    // Use the native collection because the existing User schema
    // may not yet define a status field.
    await User.collection.updateOne(
      { _id: targetUser._id },
      { $set: { status } }
    );

    const updatedUser = await User.collection.findOne(
      { _id: targetUser._id },
      { projection: { password: 0 } }
    );

    res.json({
      message: 'User status updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user status error:', error);

    res.status(500).json({
      message: 'Could not update user status.',
    });
  }
});

module.exports = router;
