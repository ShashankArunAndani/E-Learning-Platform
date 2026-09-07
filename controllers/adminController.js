const User = require('../models/User');
const Course = require('../models/Course');
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');

/**
 * List all users across the platform
 */
const listUsers = async (req, res) => {
  const users = await User.findAllUsers();

  res.render('admin/users', {
    title: 'User Management — Admin Center',
    users,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Update user status (e.g. ban / activate / deactivate)
 */
const updateUserStatus = async (req, res) => {
  const userId = parseInt(req.params.user_id, 10);
  const { status } = req.body;
  const currentAdmin = req.session.user;

  if (!['active', 'inactive', 'banned'].includes(status)) {
    req.flash('error_msg', 'Invalid status provided.');
    return res.redirect('/admin/users');
  }

  // Prevent self-banning or self-deactivation
  if (currentAdmin.user_id === userId && status !== 'active') {
    req.flash('error_msg', 'Security Policy: You cannot ban or deactivate your own admin account.');
    return res.redirect('/admin/users');
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    req.flash('error_msg', 'User not found.');
    return res.redirect('/admin/users');
  }

  await User.updateStatus(userId, status);

  // Audit log the status change
  await ActivityLog.logActivity(
    currentAdmin.user_id,
    'USER_STATUS_CHANGE',
    req.ip,
    { target_user_id: userId, target_user_email: targetUser.email, new_status: status }
  );

  req.flash('success_msg', `User account (${targetUser.email}) status has been updated to "${status}".`);
  res.redirect('/admin/users');
};

/**
 * List all courses platform-wide for moderation
 */
const listCourses = async (req, res) => {
  const courses = await Course.findAllForAdmin();

  res.render('admin/courses', {
    title: 'Course Moderation — Admin Center',
    courses,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Update course moderation lifecycle status ('draft', 'published', 'archived')
 */
const updateCourseStatus = async (req, res) => {
  const courseId = parseInt(req.params.course_id, 10);
  const { status } = req.body;
  const currentAdmin = req.session.user;

  if (!['draft', 'published', 'archived'].includes(status)) {
    req.flash('error_msg', 'Invalid course status provided.');
    return res.redirect('/admin/courses');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    req.flash('error_msg', 'Course not found.');
    return res.redirect('/admin/courses');
  }

  await Course.updateStatus(courseId, status);

  // Audit log moderation event
  await ActivityLog.logActivity(
    currentAdmin.user_id,
    'COURSE_STATUS_MODERATE',
    req.ip,
    { course_id: courseId, course_title: course.title, new_status: status }
  );

  req.flash('success_msg', `Course "${course.title}" status updated to "${status}".`);
  res.redirect('/admin/courses');
};

/**
 * List all orders and transactions across platform
 */
const listOrders = async (req, res) => {
  const orders = await Order.findAllOrdersForAdmin();

  res.render('admin/orders', {
    title: 'Orders & Payments — Admin Center',
    orders,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * View detailed order information including line items and payment logs
 */
const getOrderDetails = async (req, res) => {
  const orderId = parseInt(req.params.order_id, 10);
  const order = await Order.getOrderById(orderId);

  if (!order) {
    req.flash('error_msg', 'Order not found.');
    return res.redirect('/admin/orders');
  }

  res.render('admin/order-details', {
    title: `Order #${order.order_id} Details — Admin Center`,
    order,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

module.exports = {
  listUsers,
  updateUserStatus,
  listCourses,
  updateCourseStatus,
  listOrders,
  getOrderDetails
};
