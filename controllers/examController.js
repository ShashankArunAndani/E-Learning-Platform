const Exam = require('../models/Exam');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get exams for a course
// @route   GET /courses/:course_id/exams
// @access  Private (Instructor/Student)
exports.getExams = asyncHandler(async (req, res) => {
  const courseId = req.params.course_id;
  const course = await Course.findById(courseId);

  if (!course) {
    req.flash('error_msg', 'Course not found');
    return res.redirect('/my-courses');
  }

  const exams = await Exam.findByCourse(courseId);

  // If student, get their results
  let userResults = {};
  if (req.session.user && req.session.user.role_name === 'Student') {
    for (const exam of exams) {
      const result = await Exam.findResultByStudentAndExam(req.session.user.user_id, exam.exam_id);
      if (result) {
        userResults[exam.exam_id] = result;
      }
    }
  }

  res.render('assessments/exams', {
    title: 'Exams - ' + course.title,
    course,
    exams,
    userResults,
    role: req.session.user.role_name,
    user: req.session.user
  });
});

// @desc    Create an exam
// @route   POST /courses/:course_id/exams
// @access  Private (Instructor)
exports.createExam = asyncHandler(async (req, res) => {
  const courseId = req.params.course_id;
  const { title, total_marks, duration, exam_date } = req.body;

  await Exam.create({
    course_id: courseId,
    title,
    total_marks,
    duration,
    exam_date
  });

  req.flash('success_msg', 'Exam created successfully');
  res.redirect(`/courses/${courseId}/exams`);
});

// @desc    View single exam and results (for Instructor)
// @route   GET /courses/:course_id/exams/:exam_id
// @access  Private (Instructor)
exports.getExamDetails = asyncHandler(async (req, res) => {
  const { course_id, exam_id } = req.params;
  const course = await Course.findById(course_id);
  const exam = await Exam.findById(exam_id);

  if (!exam) {
    req.flash('error_msg', 'Exam not found');
    return res.redirect(`/courses/${course_id}/exams`);
  }

  const results = await Exam.findResultsByExam(exam_id);
  // Fetch enrolled students for manual result entry per the Phase 5 exam scope.
  const db = require('../config/db');
  const enrolledStudents = await db.query(
    `SELECT u.user_id, u.name, u.email 
     FROM Enrollments e
     JOIN Users u ON e.user_id = u.user_id
     WHERE e.course_id = ?`,
    [course_id]
  );

  res.render('assessments/exam_details', {
    title: exam.title,
    course,
    exam,
    results,
    enrolledStudents,
    role: req.session.user.role_name,
    user: req.session.user
  });
});

// @desc    Enter a result for a student
// @route   POST /courses/:course_id/exams/:exam_id/results
// @access  Private (Instructor)
exports.enterResult = asyncHandler(async (req, res) => {
  const { course_id, exam_id } = req.params;
  const { user_id, marks_obtained, grade } = req.body;

  const exam = await Exam.findById(exam_id);
  if (parseFloat(marks_obtained) > parseFloat(exam.total_marks)) {
    req.flash('error_msg', `Marks cannot exceed max marks (${exam.total_marks})`);
    return res.redirect(`/courses/${course_id}/exams/${exam_id}`);
  }

  await Exam.enterResult({
    exam_id,
    user_id,
    course_id,
    marks_obtained,
    grade
  });

  // DFD-2.9/2.12: manual exam result entry creates an in-app notification.
  await Notification.createInApp(
    user_id,
    `Your result for ${exam.title} is available: ${marks_obtained}/${exam.total_marks}${grade ? ` (${grade})` : ''}.`,
    'exam',
    'normal'
  );

  req.flash('success_msg', 'Result entered successfully.');
  res.redirect(`/courses/${course_id}/exams/${exam_id}`);
});
