const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get assignments for a course
// @route   GET /courses/:course_id/assignments
// @access  Private (Instructor/Student)
exports.getAssignments = asyncHandler(async (req, res) => {
  const courseId = req.params.course_id;
  const course = await Course.findById(courseId);

  if (!course) {
    req.flash('error_msg', 'Course not found');
    return res.redirect('/my-courses');
  }

  const assignments = await Assignment.findByCourse(courseId);

  // If student, we also need their submissions
  let userSubmissions = {};
  if (req.session.user && req.session.user.role_name === 'Student') {
    for (const assign of assignments) {
      const sub = await Submission.findByStudentAndAssignment(req.session.user.user_id, assign.assignment_id);
      if (sub) {
        userSubmissions[assign.assignment_id] = sub;
      }
    }
  }

  res.render('assessments/assignments', {
    title: 'Assignments - ' + course.title,
    course,
    assignments,
    userSubmissions,
    role: req.session.user.role_name,
    user: req.session.user
  });
});

// @desc    Create an assignment
// @route   POST /courses/:course_id/assignments
// @access  Private (Instructor)
exports.createAssignment = asyncHandler(async (req, res) => {
  const courseId = req.params.course_id;
  const { title, description, max_marks, due_date, late_submission_allowed } = req.body;

  // Basic validation could be added here

  await Assignment.create({
    course_id: courseId,
    title,
    description,
    max_marks,
    due_date,
    late_submission_allowed
  });

  req.flash('success_msg', 'Assignment created successfully');
  res.redirect(`/courses/${courseId}/assignments`);
});

// @desc    View single assignment and its submissions (for Instructor)
// @route   GET /courses/:course_id/assignments/:assignment_id
// @access  Private (Instructor)
exports.getAssignmentDetails = asyncHandler(async (req, res) => {
  const { course_id, assignment_id } = req.params;
  const course = await Course.findById(course_id);
  const assignment = await Assignment.findById(assignment_id);

  if (!assignment) {
    req.flash('error_msg', 'Assignment not found');
    return res.redirect(`/courses/${course_id}/assignments`);
  }

  const submissions = await Submission.findByAssignment(assignment_id);

  res.render('assessments/assignment_details', {
    title: assignment.title,
    course,
    assignment,
    submissions,
    role: req.session.user.role_name,
    user: req.session.user
  });
});

// @desc    Submit an assignment
// @route   POST /courses/:course_id/assignments/:assignment_id/submit
// @access  Private (Student)
exports.submitAssignment = asyncHandler(async (req, res) => {
  const { course_id, assignment_id } = req.params;
  const assignment = await Assignment.findById(assignment_id);

  if (!assignment) {
    req.flash('error_msg', 'Assignment not found');
    return res.redirect(`/courses/${course_id}/assignments`);
  }

  // Check deadline
  const now = new Date();
  const dueDate = new Date(assignment.due_date);
  if (now > dueDate && !assignment.late_submission_allowed) {
    req.flash('error_msg', 'Deadline has passed and late submissions are not allowed.');
    return res.redirect(`/courses/${course_id}/assignments`);
  }

  if (!req.file) {
    req.flash('error_msg', 'Please upload a file.');
    return res.redirect(`/courses/${course_id}/assignments`);
  }

  const fileUrl = `/uploads/assignments/${req.file.filename}`;

  try {
    await Submission.submit({
      assignment_id: assignment_id,
      user_id: req.session.user.user_id,
      course_id: course_id,
      file_url: fileUrl
    });
    req.flash('success_msg', 'Assignment submitted successfully.');
  } catch (err) {
    // If unique constraint fails
    if (err.code === 'ER_DUP_ENTRY') {
      req.flash('error_msg', 'You have already submitted this assignment.');
    } else {
      throw err;
    }
  }

  res.redirect(`/courses/${course_id}/assignments`);
});

// @desc    Grade a submission
// @route   POST /courses/:course_id/assignments/:assignment_id/grade/:submission_id
// @access  Private (Instructor)
exports.gradeSubmission = asyncHandler(async (req, res) => {
  const { course_id, assignment_id, submission_id } = req.params;
  const { marks_obtained, feedback } = req.body;

  const assignment = await Assignment.findById(assignment_id);
  if (parseFloat(marks_obtained) > parseFloat(assignment.max_marks)) {
    req.flash('error_msg', `Marks cannot exceed max marks (${assignment.max_marks})`);
    return res.redirect(`/courses/${course_id}/assignments/${assignment_id}`);
  }

  await Submission.grade(submission_id, marks_obtained, feedback);
  const submission = await Submission.findById(submission_id);
  if (submission) {
    // DFD-2.8/2.12: grading writes the submission result and notifies the student.
    await Notification.createInApp(
      submission.user_id,
      `Your submission for ${assignment.title} has been graded: ${marks_obtained}/${assignment.max_marks}.`,
      'assignment',
      'normal'
    );
  }

  req.flash('success_msg', 'Submission graded successfully.');
  res.redirect(`/courses/${course_id}/assignments/${assignment_id}`);
});
