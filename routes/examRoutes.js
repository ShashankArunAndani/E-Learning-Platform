const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: mergeParams to access :course_id
const { isAuthenticated, authorize } = require('../middleware/authMiddleware');
const examController = require('../controllers/examController');

// All assessment routes require authentication
router.use(isAuthenticated);

// GET /courses/:course_id/exams (Student and Instructor)
router.get('/', authorize('course:browse'), examController.getExams);

// POST /courses/:course_id/exams (Instructor only)
router.post('/', authorize('course:edit'), examController.createExam);

// GET /courses/:course_id/exams/:exam_id (Instructor view results entry)
router.get('/:exam_id', authorize('assignment:grade'), examController.getExamDetails);

// POST /courses/:course_id/exams/:exam_id/results (Instructor only - manual result entry)
router.post('/:exam_id/results', authorize('assignment:grade'), examController.enterResult);

module.exports = router;
