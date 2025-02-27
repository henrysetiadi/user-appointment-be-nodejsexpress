const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const moment = require("moment-timezone");

const prisma = new PrismaClient();
const SECRET_KEY = "your_secret_key";  // Use a real secret in production


// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, username, preferredTimezone } = req.body;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Get the GMT offset
    const gmtOffsetMinutes = moment.tz(preferredTimezone).utcOffset();
    const gmtOffsetHours = gmtOffsetMinutes / 60;
    const gmtOffset = `GMT${gmtOffsetHours >= 0 ? "+" : ""}${gmtOffsetHours}`;

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        preferredTimezone,
        gmtOffset
      }
    });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login Route (Username Only)
router.post(
  '/login',
  [body('username').notEmpty().withMessage('Username is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.body;

    try {
      // Find user by username
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid username' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, preferredTimezone: user.preferredTimezone },
        SECRET_KEY,
        { expiresIn: '1h' }
      );

      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Middleware to verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(403).json({ message: 'Access denied, no token provided' });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Protected Route Example
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, username: true, preferredTimezone: true },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
