const bcrypt = require('bcrypt');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * Render registration page
 */
const renderRegister = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/register', {
    title: 'Register — E-Learning Platform',
    formData: {},
    error_msg: req.flash('error_msg'),
    success_msg: req.flash('success_msg')
  });
};

/**
 * Render login page
 */
const renderLogin = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('auth/login', {
    title: 'Sign In — E-Learning Platform',
    formData: {},
    error_msg: req.flash('error_msg'),
    success_msg: req.flash('success_msg')
  });
};

/**
 * Handle user registration (Student or Instructor)
 */
const handleRegister = async (req, res) => {
  const { name, email, password, role, phone, bio, expertise, experienceYears } = req.body;

  // 1. Check if user with email already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    req.flash('error_msg', 'An account with this email address already exists.');
    return res.render('auth/register', {
      title: 'Register — E-Learning Platform',
      formData: { name, email, role, phone, bio, expertise, experienceYears },
      error_msg: req.flash('error_msg')
    });
  }

  // 2. Hash password with bcrypt
  const passwordHash = await bcrypt.hash(password, 10);
  let userId;

  // 3. Create user based on role
  if (role === 'Instructor') {
    userId = await User.createInstructor({
      name,
      email,
      passwordHash,
      phone,
      bio,
      expertise,
      experienceYears: experienceYears ? parseInt(experienceYears, 10) : 0
    });
  } else {
    userId = await User.createStudent({
      name,
      email,
      passwordHash,
      phone
    });
  }

  // 4. Record Activity Log
  const clientIp = req.ip || req.connection.remoteAddress;
  await ActivityLog.logAction(userId, 'USER_REGISTERED', clientIp, { role });

  req.flash('success_msg', 'Registration successful! You can now log in.');
  return res.redirect('/login');
};

/**
 * Handle user login
 */
const handleLogin = async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    req.flash('error_msg', 'Invalid email address or password.');
    return res.render('auth/login', {
      title: 'Sign In — E-Learning Platform',
      formData: { email },
      error_msg: req.flash('error_msg')
    });
  }

  // 2. Check account status
  if (user.status === 'banned') {
    req.flash('error_msg', 'Your account has been banned. Please contact support.');
    return res.render('auth/login', {
      title: 'Sign In — E-Learning Platform',
      formData: { email },
      error_msg: req.flash('error_msg')
    });
  }

  if (user.status === 'inactive') {
    req.flash('error_msg', 'Your account is inactive. Please contact support.');
    return res.render('auth/login', {
      title: 'Sign In — E-Learning Platform',
      formData: { email },
      error_msg: req.flash('error_msg')
    });
  }

  // 3. Compare password hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    req.flash('error_msg', 'Invalid email address or password.');
    return res.render('auth/login', {
      title: 'Sign In — E-Learning Platform',
      formData: { email },
      error_msg: req.flash('error_msg')
    });
  }

  // 4. Create Session
  req.session.user = {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role_id: user.role_id,
    role_name: user.role_name
  };

  // 5. Record Activity Log
  const clientIp = req.ip || req.connection.remoteAddress;
  await ActivityLog.logAction(user.user_id, 'USER_LOGIN', clientIp, { email: user.email });

  req.flash('success_msg', `Welcome back, ${user.name}!`);
  return res.redirect('/dashboard');
};

/**
 * Handle user logout
 */
const handleLogout = async (req, res) => {
  if (req.session && req.session.user) {
    const userId = req.session.user.user_id;
    const clientIp = req.ip || req.connection.remoteAddress;
    await ActivityLog.logAction(userId, 'USER_LOGOUT', clientIp);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/login');
  });
};

module.exports = {
  renderRegister,
  renderLogin,
  handleRegister,
  handleLogin,
  handleLogout
};
