const Course = require('../models/Course');
const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');

/**
 * Public Course Catalog view with search and filters
 */
const renderPublicCatalog = async (req, res) => {
  const { search, category_id, level } = req.query;

  const courses = await Course.findPublished({ search, category_id, level });
  const categories = await Category.getAll();

  res.render('courses/index', {
    title: 'Browse Courses — E-Learning Platform',
    courses,
    categories,
    selectedSearch: search || '',
    selectedCategory: category_id || '',
    selectedLevel: level || '',
    user: req.session ? req.session.user : null,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Public Course Detail view
 */
const renderCourseDetail = async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const course = await Course.findById(courseId);

  if (!course) {
    req.flash('error_msg', 'Course not found.');
    return res.status(404).render('error', {
      title: 'Course Not Found',
      message: 'The requested course does not exist.',
      error: { status: 404 }
    });
  }

  // Check if guest/non-owner trying to view unpublished course
  const currentUser = req.session ? req.session.user : null;
  const isOwner = currentUser && (currentUser.user_id === course.instructor_id || currentUser.role_name === 'Admin');

  if (course.status !== 'published' && !isOwner) {
    req.flash('error_msg', 'This course is currently in draft mode.');
    return res.status(403).render('error', {
      title: 'Course Unavailable',
      message: 'This course is not published yet.',
      error: { status: 403 }
    });
  }

  let isEnrolled = false;
  let enrollment = null;
  let currentUserReview = null;
  if (currentUser) {
    isEnrolled = await Enrollment.isEnrolled(currentUser.user_id, courseId);
    if (isEnrolled) {
      enrollment = await Enrollment.getEnrollment(currentUser.user_id, courseId);
      currentUserReview = await Review.findByUserAndCourse(currentUser.user_id, courseId);
    }
  }

  const reviews = await Review.findByCourse(courseId);
  const reviewSummary = await Review.getSummary(courseId);

  res.render('courses/show', {
    title: `${course.title} — E-Learning Platform`,
    course,
    isOwner,
    isEnrolled,
    enrollment,
    reviews,
    reviewSummary,
    currentUserReview,
    user: currentUser,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Instructor Dashboard / Course Management View
 */
const renderInstructorCourses = async (req, res) => {
  const user = req.session.user;
  let courses = [];

  if (user.role_name === 'Admin') {
    courses = await Course.findAllForAdmin();
  } else {
    courses = await Course.findByInstructorId(user.user_id);
  }

  res.render('courses/manage', {
    title: 'Course Workspace — E-Learning Platform',
    courses,
    user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Render Create Course Form
 */
const renderCreateCourse = async (req, res) => {
  const categories = await Category.getAll();
  res.render('courses/form', {
    title: 'Create New Course — E-Learning Platform',
    mode: 'create',
    course: {},
    categories,
    selectedCategoryIds: [],
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Handle Create Course Form Submission
 */
const handleCreateCourse = async (req, res) => {
  const { title, description, price, duration, level, status, category_ids } = req.body;
  const instructorId = req.session.user.user_id;

  // Handle category_ids payload formatting
  let categoryIds = [];
  if (Array.isArray(category_ids)) {
    categoryIds = category_ids;
  } else if (category_ids) {
    categoryIds = [category_ids];
  }

  const courseId = await Course.create({
    title,
    description,
    instructor_id: instructorId,
    price: parseFloat(price),
    duration: duration ? parseInt(duration, 10) : null,
    level,
    status: status || 'draft',
    category_ids: categoryIds
  });

  await ActivityLog.logAction(instructorId, 'COURSE_CREATED', req.ip, { courseId, title });

  req.flash('success_msg', `Course "${title}" created successfully.`);
  return res.redirect('/courses/manage');
};

/**
 * Render Edit Course Form
 */
const renderEditCourse = async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const course = await Course.findById(courseId);

  if (!course) {
    req.flash('error_msg', 'Course not found.');
    return res.redirect('/courses/manage');
  }

  const user = req.session.user;
  if (course.instructor_id !== user.user_id && user.role_name !== 'Admin') {
    req.flash('error_msg', 'Access Denied: You can only edit your own courses.');
    return res.redirect('/courses/manage');
  }

  const categories = await Category.getAll();
  const selectedCategoryIds = course.categories.map(c => c.category_id);

  res.render('courses/form', {
    title: `Edit ${course.title} — E-Learning Platform`,
    mode: 'edit',
    course,
    categories,
    selectedCategoryIds,
    user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Handle Edit Course Form Submission
 */
const handleEditCourse = async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const course = await Course.findById(courseId);

  if (!course) {
    req.flash('error_msg', 'Course not found.');
    return res.redirect('/courses/manage');
  }

  const user = req.session.user;
  if (course.instructor_id !== user.user_id && user.role_name !== 'Admin') {
    req.flash('error_msg', 'Access Denied: You can only edit your own courses.');
    return res.redirect('/courses/manage');
  }

  const { title, description, price, duration, level, status, category_ids } = req.body;

  let categoryIds = [];
  if (Array.isArray(category_ids)) {
    categoryIds = category_ids;
  } else if (category_ids) {
    categoryIds = [category_ids];
  }

  await Course.update(courseId, {
    title,
    description,
    price: parseFloat(price),
    duration: duration ? parseInt(duration, 10) : null,
    level,
    status: status || course.status,
    category_ids: categoryIds
  });

  await ActivityLog.logAction(user.user_id, 'COURSE_UPDATED', req.ip, { courseId, title });

  req.flash('success_msg', 'Course updated successfully.');
  return res.redirect('/courses/manage');
};

/**
 * Toggle Course Lifecycle Status (draft <-> published)
 */
const handleToggleStatus = async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const course = await Course.findById(courseId);

  if (!course) {
    req.flash('error_msg', 'Course not found.');
    return res.redirect('/courses/manage');
  }

  const user = req.session.user;
  if (course.instructor_id !== user.user_id && user.role_name !== 'Admin') {
    req.flash('error_msg', 'Access Denied: You do not own this course.');
    return res.redirect('/courses/manage');
  }

  const newStatus = course.status === 'published' ? 'draft' : 'published';
  await Course.updateStatus(courseId, newStatus);
  await ActivityLog.logAction(user.user_id, 'COURSE_STATUS_TOGGLED', req.ip, { courseId, newStatus });

  req.flash('success_msg', `Course status changed to "${newStatus}".`);
  return res.redirect('/courses/manage');
};

/**
 * Handle Delete Course
 */
const handleDeleteCourse = async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const course = await Course.findById(courseId);

  if (!course) {
    req.flash('error_msg', 'Course not found.');
    return res.redirect('/courses/manage');
  }

  const user = req.session.user;
  if (course.instructor_id !== user.user_id && user.role_name !== 'Admin') {
    req.flash('error_msg', 'Access Denied: You do not own this course.');
    return res.redirect('/courses/manage');
  }

  await Course.delete(courseId);
  await ActivityLog.logAction(user.user_id, 'COURSE_DELETED', req.ip, { courseId, title: course.title });

  req.flash('success_msg', 'Course deleted successfully.');
  return res.redirect('/courses/manage');
};

module.exports = {
  renderPublicCatalog,
  renderCourseDetail,
  renderInstructorCourses,
  renderCreateCourse,
  handleCreateCourse,
  renderEditCourse,
  handleEditCourse,
  handleToggleStatus,
  handleDeleteCourse
};
