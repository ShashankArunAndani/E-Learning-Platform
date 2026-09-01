const Wishlist = require('../models/Wishlist');
const Enrollment = require('../models/Enrollment');
const ActivityLog = require('../models/ActivityLog');

/**
 * Render student wishlist view
 */
const renderWishlist = async (req, res) => {
  const userId = req.session.user.user_id;
  const items = await Wishlist.getUserWishlist(userId);

  res.render('wishlist/index', {
    title: 'My Wishlist — E-Learning Platform',
    items,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Add course to wishlist
 */
const handleAddToWishlist = async (req, res) => {
  const userId = req.session.user.user_id;
  const courseId = parseInt(req.body.course_id, 10);

  // Check if student is already enrolled
  const enrolled = await Enrollment.isEnrolled(userId, courseId);
  if (enrolled) {
    req.flash('error_msg', 'You are already enrolled in this course.');
    return res.redirect(`/courses/${courseId}`);
  }

  const result = await Wishlist.add(userId, courseId);
  if (!result) {
    req.flash('error_msg', 'This course is already in your wishlist.');
  } else {
    await ActivityLog.logAction(userId, 'WISHLIST_ADD', req.ip, { courseId });
    req.flash('success_msg', 'Course added to your wishlist.');
  }

  return res.redirect('/wishlist');
};

/**
 * Remove course from wishlist
 */
const handleRemoveFromWishlist = async (req, res) => {
  const userId = req.session.user.user_id;
  const courseId = parseInt(req.body.course_id, 10);

  await Wishlist.remove(userId, courseId);
  await ActivityLog.logAction(userId, 'WISHLIST_REMOVE', req.ip, { courseId });

  req.flash('success_msg', 'Course removed from your wishlist.');
  return res.redirect('/wishlist');
};

module.exports = {
  renderWishlist,
  handleAddToWishlist,
  handleRemoveFromWishlist
};
