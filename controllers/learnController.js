const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Certificate = require('../models/Certificate');
const Notification = require('../models/Notification');

/**
 * Render My Courses student dashboard
 */
const renderMyCourses = async (req, res) => {
  const userId = req.session.user.user_id;
  const enrollments = await Enrollment.getUserEnrollments(userId);

  const stats = {
    total: enrollments.length,
    in_progress: enrollments.filter(e => e.completion_status === 'in_progress').length,
    completed: enrollments.filter(e => e.completion_status === 'completed').length,
    not_started: enrollments.filter(e => e.completion_status === 'not_started').length
  };

  res.render('learn/myCourses', {
    title: 'My Courses — Academia',
    enrollments,
    stats,
    user: req.session.user
  });
};

/**
 * Resume or start a course (smart redirect to last_accessed_lesson or first lesson)
 */
const resumeCourse = async (req, res) => {
  const courseId = parseInt(req.params.course_id, 10);
  const user = req.session.user;

  const course = await Course.findById(courseId);
  if (!course) {
    req.flash('error_msg', 'Course not found.');
    return res.redirect('/courses');
  }

  const isEnrolled = await Enrollment.isEnrolled(user.user_id, courseId);
  const isInstructorOrAdmin = user.role_name === 'Admin' || course.instructor_id === user.user_id;

  if (!isEnrolled && !isInstructorOrAdmin) {
    req.flash('error_msg', 'You must be enrolled in this course to access the learning material.');
    return res.redirect(`/courses/${courseId}`);
  }

  const lessons = await Lesson.findByCourseId(courseId);
  if (!lessons || lessons.length === 0) {
    req.flash('error_msg', 'This course does not have any published lessons yet.');
    return res.redirect('/my-courses');
  }

  // Check for last accessed lesson if enrolled
  if (isEnrolled) {
    const progress = await Progress.getProgress(user.user_id, courseId);
    if (progress && progress.last_accessed_lesson) {
      const lastLessonExists = lessons.some(l => l.lesson_id === progress.last_accessed_lesson);
      if (lastLessonExists) {
        return res.redirect(`/learn/${courseId}/lessons/${progress.last_accessed_lesson}`);
      }
    }
  }

  // Default to first lesson in order
  return res.redirect(`/learn/${courseId}/lessons/${lessons[0].lesson_id}`);
};

/**
 * Render Gated Lesson Player
 */
const renderLessonPlayer = async (req, res) => {
  const courseId = parseInt(req.params.course_id, 10);
  const lessonId = parseInt(req.params.lesson_id, 10);
  const user = req.session.user;

  const course = await Course.findById(courseId);
  if (!course) {
    req.flash('error_msg', 'Course not found.');
    return res.redirect('/courses');
  }

  const isEnrolled = await Enrollment.isEnrolled(user.user_id, courseId);
  const isInstructorOrAdmin = user.role_name === 'Admin' || course.instructor_id === user.user_id;

  // Paywall verification per DFD-2.7 (Process 7.10)
  if (!isEnrolled && !isInstructorOrAdmin) {
    req.flash('error_msg', 'Access denied. You must be enrolled in this course to view lesson content.');
    return res.redirect(`/courses/${courseId}`);
  }

  const lessons = await Lesson.findByCourseId(courseId);
  if (!lessons || lessons.length === 0) {
    req.flash('error_msg', 'No lessons available for this course.');
    return res.redirect('/my-courses');
  }

  const currentIndex = lessons.findIndex(l => l.lesson_id === lessonId);
  if (currentIndex === -1) {
    // Lesson does not belong to course or not found
    return res.redirect(`/learn/${courseId}`);
  }

  const currentLesson = lessons[currentIndex];
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  let progress = null;
  let enrollment = null;

  if (isEnrolled) {
    // Update last accessed lesson
    await Progress.updateLastAccessed(user.user_id, courseId, lessonId);
    progress = await Progress.getProgress(user.user_id, courseId);
    enrollment = await Enrollment.getEnrollment(user.user_id, courseId);
  }

  res.render('learn/player', {
    title: `${currentLesson.title} — ${course.title} | Academia`,
    course,
    lessons,
    currentLesson,
    currentIndex: currentIndex + 1,
    prevLesson,
    nextLesson,
    progress,
    enrollment,
    isEnrolled,
    isInstructorOrAdmin,
    user
  });
};

/**
 * Mark lesson as completed and synchronize progress and enrollment status
 */
const completeLesson = async (req, res) => {
  const courseId = parseInt(req.params.course_id, 10);
  const lessonId = parseInt(req.params.lesson_id, 10);
  const user = req.session.user;

  const isEnrolled = await Enrollment.isEnrolled(user.user_id, courseId);
  if (!isEnrolled) {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }
    req.flash('error_msg', 'You are not enrolled in this course.');
    return res.redirect(`/courses/${courseId}`);
  }

  const lessons = await Lesson.findByCourseId(courseId);
  const currentLesson = lessons.find(l => l.lesson_id === lessonId);
  if (!currentLesson) {
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    req.flash('error_msg', 'Lesson not found.');
    return res.redirect(`/learn/${courseId}`);
  }

  // Record completion with transaction & sync
  const result = await Progress.recordLessonCompletion(
    user.user_id,
    courseId,
    lessonId,
    currentLesson.order_index
  );

  let certificateUrl = null;
  if (result.completion_status === 'completed') {
    const certificate = await Certificate.issueIfEligible(user.user_id, courseId);
    certificateUrl = certificate.certificate_url;
    if (certificate.wasIssued) {
      await Notification.createInApp(
        user.user_id,
        `Your certificate for ${course.title} has been issued.`,
        'certificate',
        'high'
      );
    }
  }

  const currentIndex = lessons.findIndex(l => l.lesson_id === lessonId);
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
    return res.json({
      success: true,
      progress: result,
      certificateUrl,
      nextLessonUrl: nextLesson ? `/learn/${courseId}/lessons/${nextLesson.lesson_id}` : null
    });
  }

  if (nextLesson) {
    req.flash('success_msg', 'Lesson completed! Advanced to next lesson.');
    return res.redirect(`/learn/${courseId}/lessons/${nextLesson.lesson_id}`);
  } else {
    req.flash('success_msg', 'Congratulations! Your certificate has been issued.');
    return res.redirect(`/learn/${courseId}/lessons/${lessonId}`);
  }
};

module.exports = {
  renderMyCourses,
  resumeCourse,
  renderLessonPlayer,
  completeLesson
};
