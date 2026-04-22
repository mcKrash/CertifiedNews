const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));
app.use('/api/trust', require('./routes/trust'));
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/reporter-applications', require('./routes/reporterApplications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/sources', require('./routes/sources'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/meta', require('./routes/meta'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin/ai', require('./routes/adminAI'));
app.use('/api/news', require('./routes/news'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/admin/dashboard', require('./routes/adminDashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✓ API Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});
