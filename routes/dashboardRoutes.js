const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Protected main dashboard
router.get('/dashboard', isAuthenticated, asyncHandler(dashboardController.renderDashboard));

// Instructor panel (requires course:create permission)
router.get('/dashboard/instructor', isAuthenticated, authorize('course:create'), asyncHandler(dashboardController.renderInstructorDashboard));

// Admin panel (requires user:manage permission)
router.get('/dashboard/admin', isAuthenticated, authorize('user:manage'), asyncHandler(dashboardController.renderAdminDashboard));

module.exports = router;
