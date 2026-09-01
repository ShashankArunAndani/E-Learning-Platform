const session = require('express-session');
require('dotenv').config();

const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'e_learning_platform_fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
});

module.exports = sessionConfig;
