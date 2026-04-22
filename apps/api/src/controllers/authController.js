const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Register a new user (all types)
 */
const register = async (req, res) => {
  try {
    const { email, name, password, userType = 'REGULAR_USER' } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, name, and password are required',
      });
    }

    // Validate userType
    const validUserTypes = ['REGULAR_USER', 'JOURNALIST', 'AGENCY'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Generate unique username
    let username = name.toLowerCase().replace(/\s+/g, '_');
    let usernameExists = await prisma.user.findUnique({
      where: { username },
    });
    let counter = 1;
    while (usernameExists) {
      username = `${name.toLowerCase().replace(/\s+/g, '_')}_${counter}`;
      usernameExists = await prisma.user.findUnique({
        where: { username },
      });
      counter++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        name,
        password: hashedPassword,
        role: 'USER',
        userType,
      },
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          userType: user.userType,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      if (user.banExpiresAt && new Date(user.banExpiresAt) > new Date()) {
        return res.status(403).json({
          success: false,
          message: `Your account is temporarily banned until ${user.banExpiresAt}`,
        });
      } else if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: 'Your account is permanently banned',
        });
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          userType: user.userType,
          role: user.role,
          emailVerified: user.emailVerified,
          avatarUrl: user.avatarUrl,
          profilePhotoUrl: user.profilePhotoUrl,
          preferences: user.preferences,
          journalistProfile: user.journalistProfile,
          agencyProfile: user.agencyProfile,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

/**
 * Get current user
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        userType: user.userType,
        role: user.role,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        profilePhotoUrl: user.profilePhotoUrl,
        isVerified: user.isVerified,
        emailVerified: user.emailVerified,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
        preferences: user.preferences,
        journalistProfile: user.journalistProfile,
        agencyProfile: user.agencyProfile,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};

/**
 * Save user preferences (onboarding)
 */
const savePreferences = async (req, res) => {
  try {
    const { topicsOfInterest, preferredLanguage, avatarUrl } = req.body;
    const userId = req.user.id;

    // Update or create preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        topicsOfInterest: topicsOfInterest || [],
        preferredLanguage: preferredLanguage || 'en',
      },
      create: {
        userId,
        topicsOfInterest: topicsOfInterest || [],
        preferredLanguage: preferredLanguage || 'en',
      },
    });

    // Update user avatar if provided
    if (avatarUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Preferences saved successfully',
      data: preferences,
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save preferences',
      error: error.message,
    });
  }
};

/**
 * Save journalist profile
 */
const saveJournalistProfile = async (req, res) => {
  try {
    const { beat, affiliatedOrg, portfolioUrl, topicsOfInterest, preferredLanguage } = req.body;
    const userId = req.user.id;

    // Create or update journalist profile
    const profile = await prisma.journalistProfile.upsert({
      where: { userId },
      update: {
        beat,
        affiliatedOrg,
        portfolioUrl,
      },
      create: {
        userId,
        beat,
        affiliatedOrg,
        portfolioUrl,
      },
    });

    // Save preferences
    await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        topicsOfInterest: topicsOfInterest || [],
        preferredLanguage: preferredLanguage || 'en',
      },
      create: {
        userId,
        topicsOfInterest: topicsOfInterest || [],
        preferredLanguage: preferredLanguage || 'en',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Journalist profile saved successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Save journalist profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save journalist profile',
      error: error.message,
    });
  }
};

/**
 * Save agency profile
 */
const saveAgencyProfile = async (req, res) => {
  try {
    const {
      organizationName,
      website,
      country,
      agencyType,
      registrationNumber,
      primaryContactName,
      primaryContactEmail,
      logoUrl,
      description,
      twitter,
      facebook,
      instagram,
    } = req.body;
    const userId = req.user.id;

    // Create or update agency profile
    const profile = await prisma.agencyProfile.upsert({
      where: { userId },
      update: {
        organizationName,
        website,
        country,
        agencyType,
        registrationNumber,
        primaryContactName,
        primaryContactEmail,
        logoUrl,
        description,
      },
      create: {
        userId,
        organizationName,
        website,
        country,
        agencyType,
        registrationNumber,
        primaryContactName,
        primaryContactEmail,
        logoUrl,
        description,
      },
    });

    // Create or update social handles
    if (twitter || facebook || instagram) {
      await prisma.socialHandles.upsert({
        where: { agencyProfileId: profile.id },
        update: { twitter, facebook, instagram },
        create: {
          agencyProfileId: profile.id,
          twitter,
          facebook,
          instagram,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Agency profile saved successfully',
      data: profile,
    });
  } catch (error) {
    console.error('Save agency profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save agency profile',
      error: error.message,
    });
  }
};

/**
 * Verify email
 */
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
      });
    }

    // In production, verify the code from your email service
    // For now, accept any 6-digit code
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code format',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message,
    });
  }
};

/**
 * Google OAuth callback handler
 */
const googleCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Exchange code for tokens via Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.FRONTEND_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const googleUser = await userInfoResponse.json();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      // Create new user from Google info
      const username = googleUser.email.split('@')[0];
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          username,
          name: googleUser.name || googleUser.email,
          avatarUrl: googleUser.picture,
          emailVerified: googleUser.verified_email || false,
          role: 'USER',
          userType: 'REGULAR_USER',
          password: null, // No password for OAuth users
        },
      });
    } else {
      // Update existing user with Google info if needed
      if (!user.avatarUrl && googleUser.picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: googleUser.picture },
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        userType: user.userType,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  savePreferences,
  saveJournalistProfile,
  saveAgencyProfile,
  verifyEmail,
  generateToken,
  googleCallback,
};
