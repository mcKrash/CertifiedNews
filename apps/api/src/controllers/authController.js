const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const API_BASE_URL = process.env.API_BASE_URL || process.env.BACKEND_URL || 'https://certifiednews.onrender.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://wcna.live';

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

const generateVerificationToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      purpose: 'email_verification',
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  username: user.username,
  userType: user.userType,
  role: user.role,
  bio: user.bio || null,
  avatarUrl: user.avatarUrl || null,
  profilePhotoUrl: user.profilePhotoUrl || null,
  isVerified: user.isVerified,
  emailVerified: user.emailVerified,
  preferences: user.preferences || null,
  journalistProfile: user.journalistProfile || null,
  agencyProfile: user.agencyProfile || null,
  createdAt: user.createdAt,
});

const buildAvatarUrl = (style, seed) => `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendVerificationEmail = async (user) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn('Email transporter not configured. Skipping verification email send.');
    return { sent: false, reason: 'Email credentials are not configured' };
  }

  const token = generateVerificationToken(user);
  const verificationUrl = `${API_BASE_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const fallbackUrl = `${FRONTEND_URL}/?verified=1`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: user.email,
    subject: 'Verify your WCNA account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to WCNA</h2>
        <p>Hello ${user.name},</p>
        <p>Please verify your email address to complete your account setup.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:#00B4A0;color:#ffffff;text-decoration:none;border-radius:6px;">
            Verify Email
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>After verification, you can continue using WCNA at <a href="${fallbackUrl}">${fallbackUrl}</a>.</p>
      </div>
    `,
  });

  return { sent: true };
};

const resolveUniqueUsername = async (baseValue) => {
  const slugBase = (baseValue || 'user')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'user';

  let username = slugBase;
  let counter = 1;

  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${slugBase}_${counter}`;
    counter += 1;
  }

  return username;
};

const register = async (req, res) => {
  try {
    const { email, name, password, userType = 'REGULAR_USER', username } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, name, and password are required',
      });
    }

    const validUserTypes = ['REGULAR_USER', 'JOURNALIST', 'AGENCY'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const finalUsername = await resolveUniqueUsername(username || name || normalizedEmail.split('@')[0]);
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultAvatarUrl = userType === 'REGULAR_USER'
      ? buildAvatarUrl('adventurer', finalUsername)
      : null;

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: finalUsername,
        name: name.trim(),
        password: hashedPassword,
        role: 'USER',
        userType,
        avatarUrl: defaultAvatarUrl,
      },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: true,
      },
    });

    const token = generateToken(user);
    const emailResult = await sendVerificationEmail(user).catch((error) => {
      console.error('Verification email send error:', error);
      return { sent: false, reason: error.message };
    });

    return res.status(201).json({
      success: true,
      message: emailResult.sent
        ? 'User registered successfully. Verification email sent.'
        : 'User registered successfully. Verification email could not be sent.',
      data: {
        user: sanitizeUser(user),
        token,
        verificationEmailSent: emailResult.sent,
        verificationEmailReason: emailResult.reason || null,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email or username and password are required',
      });
    }

    const identifier = email.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier },
        ],
      },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: {
          include: {
            socialHandles: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    if (user.isBanned) {
      if (user.banExpiresAt && new Date(user.banExpiresAt) > new Date()) {
        return res.status(403).json({
          success: false,
          message: `Your account is temporarily banned until ${user.banExpiresAt}`,
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Your account is permanently banned',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: {
          include: { socialHandles: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};

const savePreferences = async (req, res) => {
  try {
    const { topicsOfInterest, preferredLanguage, avatarUrl, name, bio } = req.body;
    const userId = req.user.id;

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        topicsOfInterest: Array.isArray(topicsOfInterest) ? topicsOfInterest : [],
        preferredLanguage: preferredLanguage || 'en',
      },
      create: {
        userId,
        topicsOfInterest: Array.isArray(topicsOfInterest) ? topicsOfInterest : [],
        preferredLanguage: preferredLanguage || 'en',
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(name ? { name } : {}),
        ...(typeof bio === 'string' ? { bio } : {}),
      },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: {
          include: { socialHandles: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Preferences saved successfully',
      data: {
        preferences,
        user: sanitizeUser(updatedUser),
      },
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save preferences',
      error: error.message,
    });
  }
};

const saveJournalistProfile = async (req, res) => {
  try {
    const {
      beat,
      affiliatedOrg,
      portfolioUrl,
      topicsOfInterest,
      preferredLanguage,
      profilePhotoUrl,
      bio,
      name,
    } = req.body;
    const userId = req.user.id;

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

    await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        topicsOfInterest: Array.isArray(topicsOfInterest) ? topicsOfInterest : [],
        preferredLanguage: preferredLanguage || 'en',
      },
      create: {
        userId,
        topicsOfInterest: Array.isArray(topicsOfInterest) ? topicsOfInterest : [],
        preferredLanguage: preferredLanguage || 'en',
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(profilePhotoUrl ? { profilePhotoUrl, avatarUrl: profilePhotoUrl } : {}),
        ...(bio ? { bio } : {}),
        ...(name ? { name } : {}),
      },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Journalist profile saved successfully',
      data: {
        profile,
        user: sanitizeUser(updatedUser),
      },
    });
  } catch (error) {
    console.error('Save journalist profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save journalist profile',
      error: error.message,
    });
  }
};

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
      topicsOfInterest,
      preferredLanguage,
      name,
      bio,
    } = req.body;
    const userId = req.user.id;

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

    await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        topicsOfInterest: Array.isArray(topicsOfInterest) ? topicsOfInterest : [],
        preferredLanguage: preferredLanguage || 'en',
      },
      create: {
        userId,
        topicsOfInterest: Array.isArray(topicsOfInterest) ? topicsOfInterest : [],
        preferredLanguage: preferredLanguage || 'en',
      },
    });

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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(logoUrl ? { avatarUrl: logoUrl, profilePhotoUrl: logoUrl } : {}),
        ...(name ? { name } : {}),
        ...(bio ? { bio } : {}),
      },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: {
          include: { socialHandles: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Agency profile saved successfully',
      data: {
        profile,
        user: sanitizeUser(updatedUser),
      },
    });
  } catch (error) {
    console.error('Save agency profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save agency profile',
      error: error.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    if (decoded.purpose !== 'email_verification') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token purpose',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    if (req.query.token) {
      return res.redirect(`${FRONTEND_URL}/?verified=1`);
    }

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message,
    });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
      });
    }

    const emailResult = await sendVerificationEmail(user).catch((error) => ({
      sent: false,
      reason: error.message,
    }));

    if (!emailResult.sent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
        error: emailResult.reason,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message,
    });
  }
};

const googleCallback = async (req, res) => {
  try {
    const { code, userType = 'REGULAR_USER' } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${FRONTEND_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange code for tokens');
    }

    const accessToken = tokenData.access_token;
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const googleUser = await userInfoResponse.json();
    if (!userInfoResponse.ok) {
      throw new Error(googleUser.error?.message || 'Failed to fetch user info from Google');
    }

    let user = await prisma.user.findUnique({
      where: { email: googleUser.email.toLowerCase() },
      include: {
        preferences: true,
        journalistProfile: true,
        agencyProfile: {
          include: { socialHandles: true },
        },
      },
    });

    if (!user) {
      const uniqueUsername = await resolveUniqueUsername(googleUser.email.split('@')[0]);
      const randomPassword = await bcrypt.hash(`${googleUser.id}:${Date.now()}`, 10);

      user = await prisma.user.create({
        data: {
          email: googleUser.email.toLowerCase(),
          username: uniqueUsername,
          name: googleUser.name || uniqueUsername,
          avatarUrl: googleUser.picture || buildAvatarUrl('adventurer', uniqueUsername),
          emailVerified: Boolean(googleUser.verified_email),
          role: 'USER',
          userType,
          password: randomPassword,
        },
        include: {
          preferences: true,
          journalistProfile: true,
          agencyProfile: {
            include: { socialHandles: true },
          },
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          avatarUrl: user.avatarUrl || googleUser.picture || user.avatarUrl,
          emailVerified: user.emailVerified || Boolean(googleUser.verified_email),
        },
        include: {
          preferences: true,
          journalistProfile: true,
          agencyProfile: {
            include: { socialHandles: true },
          },
        },
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    console.error('Google callback error:', error);
    return res.status(500).json({
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
  resendVerificationEmail,
  generateToken,
  googleCallback,
};
