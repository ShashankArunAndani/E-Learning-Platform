const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { isAuthenticated, authorize } = require('../middleware/authMiddleware');
const { validateLesson } = require('../middleware/validationMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Lesson Management Routes (nested under course)
router.get('/courses/:course_id/lessons', isAuthenticated, authorize('course:edit'), asyncHandler(lessonController.renderLessonManager));
router.post('/courses/:course_id/lessons', isAuthenticated, authorize('course:edit'), validateLesson, asyncHandler(lessonController.handleCreateLesson));
router.post('/courses/:course_id/lessons/:lesson_id/edit', isAuthenticated, authorize('course:edit'), validateLesson, asyncHandler(lessonController.handleUpdateLesson));
router.post('/courses/:course_id/lessons/:lesson_id/delete', isAuthenticated, authorize('course:edit'), asyncHandler(lessonController.handleDeleteLesson));

module.exports = router;
