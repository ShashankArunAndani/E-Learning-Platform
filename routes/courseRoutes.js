const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { isAuthenticated, authorize } = require('../middleware/authMiddleware');
const { validateCourse } = require('../middleware/validationMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Public Course Routes
router.get('/courses', asyncHandler(courseController.renderPublicCatalog));

// Instructor / Admin Management Routes
router.get('/courses/manage', isAuthenticated, authorize('course:create'), asyncHandler(courseController.renderInstructorCourses));
router.get('/courses/new', isAuthenticated, authorize('course:create'), asyncHandler(courseController.renderCreateCourse));
router.post('/courses/new', isAuthenticated, authorize('course:create'), validateCourse, asyncHandler(courseController.handleCreateCourse));

// Course Details
router.get('/courses/:id', asyncHandler(courseController.renderCourseDetail));

// Edit & Actions
router.get('/courses/:id/edit', isAuthenticated, authorize('course:edit'), asyncHandler(courseController.renderEditCourse));
router.post('/courses/:id/edit', isAuthenticated, authorize('course:edit'), validateCourse, asyncHandler(courseController.handleEditCourse));
router.post('/courses/:id/status', isAuthenticated, authorize('course:publish'), asyncHandler(courseController.handleToggleStatus));
router.post('/courses/:id/delete', isAuthenticated, authorize('course:delete'), asyncHandler(courseController.handleDeleteCourse));

module.exports = router;
