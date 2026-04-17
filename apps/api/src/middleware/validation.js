const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

const postLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 posts per hour
  message: 'Too many posts created, please try again later.',
});

/**
 * Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Auth validation rules
 */
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and numbers'),
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const validateArticle = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('body')
    .trim()
    .notEmpty()
    .withMessage('Body is required')
    .isLength({ min: 20 })
    .withMessage('Body must be at least 20 characters'),
  body('categoryId')
    .notEmpty()
    .withMessage('Category is required'),
  body('sourceId')
    .notEmpty()
    .withMessage('Source is required'),
];

const validateComment = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment cannot be empty')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters'),
];

const validatePost = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Post content cannot be empty')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Post must be between 1 and 5000 characters'),
  body('categoryId')
    .notEmpty()
    .withMessage('Category is required'),
];

module.exports = {
  apiLimiter,
  authLimiter,
  postLimiter,
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateArticle,
  validateComment,
  validatePost,
};
