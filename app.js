// Load environment variables
require('dotenv').config();

// Only allow a fallback JWT secret in development.
if (!process.env.JWT_SECRET) {
  if ((process.env.NODE_ENV || 'development') === 'development') {
    console.warn('⚠️  WARNING: JWT_SECRET not set in .env file. Using default (NOT SECURE FOR PRODUCTION)');
    process.env.JWT_SECRET = 'tripnetwork-default-secret-key-change-in-production';
  } else {
    throw new Error('JWT_SECRET is required in production');
  }
}

// Check Amadeus credentials
if (!process.env.AMADEUS_CLIENT_ID || !process.env.AMADEUS_CLIENT_SECRET) {
  console.warn('⚠️ Amadeus credentials missing. Search will fallback to mock data.');
}

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Sequelize instance — verifies DB connection on startup
const { sequelize } = require('./models/index');
sequelize.authenticate()
  .then(async () => {
    console.log('✅ Database connected successfully (Sequelize)');
    
    // Sync models with database schema (Development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Models synced with database schema');
    }

    // Ensure there's an admin user available for development/testing
    try {
      const { User } = require('./models/index');
      const bcrypt = require('bcryptjs');
      const adminEmail = process.env.DEV_ADMIN_EMAIL || 'admin@tripnetwork.com';
      const adminPassword = process.env.DEV_ADMIN_PASSWORD || 'password';

      const existing = await User.findOne({ where: { email: adminEmail } });
      if (!existing) {
        const hash = await bcrypt.hash(adminPassword, 10);
        await User.create({
          name: 'System Admin',
          email: adminEmail,
          phone: '0000000000',
          password_hash: hash,
          role: 'ADMIN',
          status: 'ACTIVE'
        });
        console.log(`✅ Dev admin created: ${adminEmail} / ${adminPassword}`);
      } else {
        console.log(`ℹ️ Dev admin exists: ${existing.email}`);
      }
    } catch (err) {
      console.error('Failed to ensure dev admin user:', err.message);
    }

  })
  .catch(err => console.error('❌ Database connection failed:', err.message));

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var adminRouter = require('./routes/admin');
var flightsRouter = require('./routes/flights');
var paymentRouter = require('./routes/payment');
var packagesRouter = require('./routes/packages');
var hotelsRouter = require('./routes/hotels');
var bookingsRouter = require('./routes/bookings');
var customRequestsRouter = require('./routes/customRequests');
var chatRouter = require('./routes/chat');
var aiRouter = require('./routes/aiRoutes');
var recommendationRouter = require('./routes/recommendationRoutes');
var notificationsRouter = require('./routes/notifications');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Serve React/Vite build if present (so redirects to frontend routes don't 404)
const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDistPath));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Routes
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/packages', packagesRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/custom-requests', customRequestsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/ai', aiRouter);
app.use('/api/recommendations', recommendationRouter);
app.use('/api/notifications', notificationsRouter);

// SPA fallback: return frontend index.html for non-API GET routes
app.get('*', (req, res, next) => {
  if (req.originalUrl && req.originalUrl.startsWith('/api')) return next();
  // Let existing public files be served normally
  if (req.method !== 'GET') return next();

  return res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) return next();
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // Check if request is for API (starts with /api)
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    // Return JSON error for API routes
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
      error: req.app.get('env') === 'development' ? err.stack : undefined
    });
  }

  // Render error page for non-API routes
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
