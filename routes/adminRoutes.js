const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, authorize } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// All admin routes require authentication and 'user:manage' admin-level RBAC permission
router.use('/admin', isAuthenticated, authorize('user:manage'));

// User Management
router.get('/admin/users', asyncHandler(adminController.listUsers));
router.post('/admin/users/:user_id/status', asyncHandler(adminController.updateUserStatus));

// Course Moderation
router.get('/admin/courses', asyncHandler(adminController.listCourses));
router.post('/admin/courses/:course_id/status', asyncHandler(adminController.updateCourseStatus));

// Orders & Payments Overview
router.get('/admin/orders', asyncHandler(adminController.listOrders));
router.get('/admin/orders/:order_id', asyncHandler(adminController.getOrderDetails));

module.exports = router;
