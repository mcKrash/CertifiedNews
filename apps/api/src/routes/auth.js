const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { users } = require('../data/mockData');

// Mock email transporter (using a free service like Ethereal for demo)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'demo@example.com',
    pass: process.env.EMAIL_PASS || 'demo_password',
  },
});

// Store verification codes temporarily
const verificationCodes = new Map();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, username, mobile, age, password } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      username,
      mobile: mobile || '',
      age: age || null,
      password_hash: hashedPassword,
      role: 'member',
      trust_score: 0,
      avatar_url: null,
      is_banned: false,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        mobile: newUser.mobile,
        age: newUser.age,
        trustScore: newUser.trust_score,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    // Find user by email or username
    const user = users.find(u => u.email === email || u.username === email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        mobile: user.mobile,
        age: user.age,
        trustScore: user.trust_score,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send verification code endpoint
router.post('/send-verification', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and code required' });
    }

    // Store verification code (expires in 10 minutes)
    verificationCodes.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

    // Send email (for demo, we'll just log it)
    console.log(`Verification code for ${email}: ${code}`);

    // Uncomment to use real email sending:
    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: email,
    //   subject: 'Certified News - Email Verification',
    //   html: `
    //     <h2>Email Verification</h2>
    //     <p>Your verification code is: <strong>${code}</strong></p>
    //     <p>This code expires in 10 minutes.</p>
    //   `,
    // });

    res.status(200).json({
      success: true,
      message: 'Verification code sent',
      // For demo purposes, return the code
      code,
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Google login endpoint
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Google token required' });
    }

    // In production, verify the token with Google
    // For now, we'll create/find a user based on the token
    const mockGoogleUser = {
      email: `user_${Date.now()}@google.com`,
      username: `user_${Date.now()}`,
      role: 'member',
      trust_score: 0,
    };

    let user = users.find(u => u.email === mockGoogleUser.email);
    if (!user) {
      user = {
        id: users.length + 1,
        ...mockGoogleUser,
        password_hash: null,
        avatar_url: null,
        is_banned: false,
        created_at: new Date().toISOString(),
      };
      users.push(user);
    }

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        trustScore: user.trust_score,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
