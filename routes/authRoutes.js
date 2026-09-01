const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validationMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Register routes
router.get('/register', authController.renderRegister);
router.post(
  '/register',
  validateRegister,
  handleValidationErrors('auth/register', 'Register — E-Learning Platform'),
  asyncHandler(authController.handleRegister)
);

// Login routes
router.get('/login', authController.renderLogin);
router.post(
  '/login',
  validateLogin,
  handleValidationErrors('auth/login', 'Sign In — E-Learning Platform'),
  asyncHandler(authController.handleLogin)
);

// Logout route
router.get('/logout', asyncHandler(authController.handleLogout));
router.post('/logout', asyncHandler(authController.handleLogout));

module.exports = router;
