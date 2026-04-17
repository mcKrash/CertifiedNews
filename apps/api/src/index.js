require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet()); // Security headers

// Enable CORS with explicit configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});


// API Routes
const articlesRouter = require('./routes/articles');
const postsRouter = require('./routes/posts');
const metaRouter = require('./routes/meta');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const verificationRouter = require('./routes/verification');
const sourcesRouter = require('./routes/sources');

app.use('/api/articles', articlesRouter);
app.use('/api/posts', postsRouter);
app.use('/api', metaRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/sources', sourcesRouter);

console.log('✅ Articles route registered');
console.log('✅ Posts route registered');
console.log('✅ Meta routes registered');
console.log('✅ Auth routes registered');
console.log('✅ Users route registered');
console.log('✅ Verification route registered');
console.log('✅ Sources route registered');

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
