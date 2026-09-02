const express = require('express');
const router = express.Router();
const learnController = require('../controllers/learnController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Student Enrolled Courses Dashboard
router.get('/my-courses', isAuthenticated, asyncHandler(learnController.renderMyCourses));

// Smart Course Resume Router (redirects to last_accessed_lesson or first lesson)
router.get('/learn/:course_id', isAuthenticated, asyncHandler(learnController.resumeCourse));

// Gated Lesson Player
router.get('/learn/:course_id/lessons/:lesson_id', isAuthenticated, asyncHandler(learnController.renderLessonPlayer));

// Complete Lesson & Synchronize Progress
router.post('/learn/:course_id/lessons/:lesson_id/complete', isAuthenticated, asyncHandler(learnController.completeLesson));

module.exports = router;
