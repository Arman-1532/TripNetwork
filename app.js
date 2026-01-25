// Load environment variables
require('dotenv').config();

// Set default JWT_SECRET if not provided (for development only)
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set in .env file. Using default (NOT SECURE FOR PRODUCTION)');
  process.env.JWT_SECRET = 'tripnetwork-default-secret-key-change-in-production';
}

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var adminRouter = require('./routes/admin');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

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
