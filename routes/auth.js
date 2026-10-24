const express = require('express');
const router = express.Router();
const User = require('../Models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Supported roles — database aur frontend mein lowercase use honge
const ALLOWED_ROLES = [
  'farmer',
  'buyer',
  'agriculturalist',
  'supplier'
];

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        message: 'Name, email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Normalize role: Farmer -> farmer
    const normalizedRole = String(role || 'farmer')
      .trim()
      .toLowerCase();

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        message: 'Invalid role selected.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      phone: '0000000000'
    });

    await newUser.save();

    return res.status(201).json({
      message: 'Registration successful!',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Registration Error:', err.message);

    if (err.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: err.message
      });
    }

    return res.status(500).json({
      message: 'Registration failed. Please try again.'
    });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing in .env');

      return res.status(500).json({
        message: 'Server authentication is not configured.'
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login Error:', err.message);

    return res.status(500).json({
      message: 'Login failed. Please try again.'
    });
  }
});

module.exports = router;