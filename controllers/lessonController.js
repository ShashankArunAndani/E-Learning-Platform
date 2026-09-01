const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const ActivityLog = require('../models/ActivityLog');

/**
 * Render Lesson Manager View for a Course
 */
const renderLessonManager = async (req, res) => {
  const courseId = parseInt(req.params.course_id, 10);
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

  const lessons = await Lesson.findByCourseId(courseId);
  const nextOrder = await Lesson.getNextOrderIndex(courseId);

  res.render('courses/lessons', {
    title: `Lessons — ${course.title}`,
    course,
    lessons,
    nextOrder,
    user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Handle Lesson Creation
 */
const handleCreateLesson = async (req, res) => {
  const courseId = parseInt(req.params.course_id, 10);
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

  const { title, content_type, content_url, duration, order_index } = req.body;

  let finalOrder = order_index ? parseInt(order_index, 10) : await Lesson.getNextOrderIndex(courseId);

  try {
    const lessonId = await Lesson.create({
      course_id: courseId,
      title,
      content_type,
      content_url,
      duration: duration ? parseInt(duration, 10) : null,
      order_index: finalOrder
    });

    await ActivityLog.logAction(user.user_id, 'LESSON_CREATED', req.ip, { courseId, lessonId, title });

    req.flash('success_msg', `Lesson "${title}" added successfully.`);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      req.flash('error_msg', `Order index ${finalOrder} is already in use for this course. Please pick a unique order number.`);
    } else {
      throw err;
    }
  }

  return res.redirect(`/courses/${courseId}/lessons`);
};

/**
 * Handle Lesson Update
 */
const handleUpdateLesson = async (req, res) => {
  const courseId = parseInt(req.params.course_id, 10);
  const lessonId = parseInt(req.params.lesson_id, 10);
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

  const { title, content_type, content_url, duration, order_index } = req.body;

  try {
    await Lesson.update(lessonId, {
      title,
      content_type,
      content_url,
      duration: duration ? parseInt(duration, 10) : null,
      order_index: parseInt(order_index, 10)
    });

    await ActivityLog.logAction(user.user_id, 'LESSON_UPDATED', req.ip, { courseId, lessonId, title });

    req.flash('success_msg', 'Lesson updated successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      req.flash('error_msg', `Order index ${order_index} is already taken by another lesson.`);
    } else {
      throw err;
    }
  }

  return res.redirect(`/courses/${courseId}/lessons`);
};

/**
 * Handle Lesson Deletion
 */
const handleDeleteLesson = async (req, res) => {
  const courseId = parseInt(req.params.course_id, 10);
  const lessonId = parseInt(req.params.lesson_id, 10);
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

  await Lesson.delete(lessonId);
  await ActivityLog.logAction(user.user_id, 'LESSON_DELETED', req.ip, { courseId, lessonId });

  req.flash('success_msg', 'Lesson deleted successfully.');
  return res.redirect(`/courses/${courseId}/lessons`);
};

module.exports = {
  renderLessonManager,
  handleCreateLesson,
  handleUpdateLesson,
  handleDeleteLesson
};
