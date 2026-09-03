const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: mergeParams to access :course_id
const { isAuthenticated, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const assignmentController = require('../controllers/assignmentController');

// All assessment routes require authentication
router.use(isAuthenticated);

// GET /courses/:course_id/assignments (Student and Instructor)
router.get('/', authorize('manage_courses', 'view_courses', 'enroll_courses'), assignmentController.getAssignments);

// POST /courses/:course_id/assignments (Instructor only)
router.post('/', authorize('manage_courses'), assignmentController.createAssignment);

// GET /courses/:course_id/assignments/:assignment_id (Instructor view submissions)
router.get('/:assignment_id', authorize('manage_courses'), assignmentController.getAssignmentDetails);

// POST /courses/:course_id/assignments/:assignment_id/submit (Student only)
// Note: 'enroll_courses' is a basic student permission, but strictly speaking we should check actual enrollment. The controller/DB logic handles this.
router.post('/:assignment_id/submit', authorize('enroll_courses'), upload.single('assignment_file'), assignmentController.submitAssignment);

// POST /courses/:course_id/assignments/:assignment_id/grade/:submission_id (Instructor only)
router.post('/:assignment_id/grade/:submission_id', authorize('manage_courses'), assignmentController.gradeSubmission);

module.exports = router;
