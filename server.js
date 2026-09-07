const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const flash = require('connect-flash');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const sessionConfig = require('./config/session');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/db');

// Import Route Handlers
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const courseRoutes = require('./routes/courseRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const couponRoutes = require('./routes/couponRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const learnRoutes = require('./routes/learnRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const examRoutes = require('./routes/examRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const Notification = require('./models/Notification');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware (Helmet configured to allow Google Fonts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"]
      }
    }
  })
);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting for Auth routes to prevent brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts from this IP. Please try again after 1 minute.'
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Middleware
app.use(sessionConfig);

// Connect Flash Middleware
app.use(flash());

// Global template variables middleware
app.use(async (req, res, next) => {
  res.locals.user = req.session ? req.session.user || null : null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.unreadNotificationCount = 0;

  try {
    if (res.locals.user) {
      res.locals.unreadNotificationCount = await Notification.getUnreadCount(res.locals.user.user_id);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Mount Routes
app.use('/', indexRoutes);
app.use('/', authRateLimiter, authRoutes);
app.use('/', dashboardRoutes);
app.use('/', categoryRoutes);
app.use('/', courseRoutes);
app.use('/', lessonRoutes);
app.use('/', wishlistRoutes);
app.use('/', cartRoutes);
app.use('/', couponRoutes);
app.use('/', checkoutRoutes);
app.use('/', learnRoutes);
app.use('/', certificateRoutes);
app.use('/', reviewRoutes);
app.use('/', notificationRoutes);
app.use('/', adminRoutes);
app.use('/courses/:course_id/assignments', assignmentRoutes);
app.use('/courses/:course_id/exams', examRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404);
  if (req.accepts('html')) {
    return res.render('error', {
      title: '404 Page Not Found',
      message: 'The page or resource you are looking for does not exist.',
      error: { status: 404 }
    });
  }
  return res.json({ error: 'Resource Not Found', status: 404 });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start server (only if not required as a module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  E-Learning Platform Server Listening on Port ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
