const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Enrollment = require('../models/Enrollment');
const ActivityLog = require('../models/ActivityLog');

/**
 * Render student cart view
 */
const renderCart = async (req, res) => {
  const userId = req.session.user.user_id;
  const cartSummary = await Cart.getCartSummary(userId);

  let appliedCoupon = req.session.applied_coupon || null;
  let discountAmount = 0;

  if (appliedCoupon && cartSummary.items.length > 0) {
    // Re-validate coupon against current subtotal
    const valResult = await Coupon.validateCoupon(appliedCoupon.code, cartSummary.subtotal);
    if (valResult.valid) {
      discountAmount = valResult.discount_amount;
      appliedCoupon.discount_amount = discountAmount;
      req.session.applied_coupon = appliedCoupon;
    } else {
      // Coupon no longer valid (e.g. min amount not met)
      req.session.applied_coupon = null;
      appliedCoupon = null;
      req.flash('error_msg', `Applied coupon removed: ${valResult.message}`);
    }
  } else if (cartSummary.items.length === 0) {
    req.session.applied_coupon = null;
    appliedCoupon = null;
  }

  const totalAmount = Math.max(0, parseFloat((cartSummary.subtotal - discountAmount).toFixed(2)));

  res.render('cart/index', {
    title: 'Shopping Cart — E-Learning Platform',
    cart: cartSummary,
    appliedCoupon,
    discountAmount,
    totalAmount,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Add course to cart
 */
const handleAddToCart = async (req, res) => {
  const userId = req.session.user.user_id;
  const courseId = parseInt(req.body.course_id, 10);

  // Check enrollment
  const enrolled = await Enrollment.isEnrolled(userId, courseId);
  if (enrolled) {
    req.flash('error_msg', 'You are already enrolled in this course.');
    return res.redirect(`/courses/${courseId}`);
  }

  const result = await Cart.addItem(userId, courseId);
  if (!result.success) {
    req.flash('error_msg', result.message || 'Course already in cart.');
  } else {
    await ActivityLog.logAction(userId, 'CART_ADD_ITEM', req.ip, { courseId });
    req.flash('success_msg', 'Course added to your cart.');
  }

  return res.redirect('/cart');
};

/**
 * Remove course from cart
 */
const handleRemoveFromCart = async (req, res) => {
  const userId = req.session.user.user_id;
  const courseId = parseInt(req.body.course_id, 10);

  await Cart.removeItem(userId, courseId);
  await ActivityLog.logAction(userId, 'CART_REMOVE_ITEM', req.ip, { courseId });

  req.flash('success_msg', 'Course removed from cart.');
  return res.redirect('/cart');
};

/**
 * Apply coupon code to cart session
 */
const handleApplyCoupon = async (req, res) => {
  const userId = req.session.user.user_id;
  const { code } = req.body;

  if (!code || code.trim() === '') {
    req.flash('error_msg', 'Please enter a coupon code.');
    return res.redirect('/cart');
  }

  const cartSummary = await Cart.getCartSummary(userId);
  if (cartSummary.items.length === 0) {
    req.flash('error_msg', 'Your cart is empty.');
    return res.redirect('/cart');
  }

  const valResult = await Coupon.validateCoupon(code, cartSummary.subtotal);
  if (!valResult.valid) {
    req.flash('error_msg', valResult.message);
    return res.redirect('/cart');
  }

  req.session.applied_coupon = {
    coupon_id: valResult.coupon.coupon_id,
    code: valResult.coupon.code,
    discount_type: valResult.coupon.discount_type,
    discount_value: valResult.coupon.discount_value,
    discount_amount: valResult.discount_amount
  };

  await ActivityLog.logAction(userId, 'COUPON_APPLIED', req.ip, { code: valResult.coupon.code });

  req.flash('success_msg', valResult.message);
  return res.redirect('/cart');
};

/**
 * Remove applied coupon from session
 */
const handleRemoveCoupon = (req, res) => {
  req.session.applied_coupon = null;
  req.flash('success_msg', 'Coupon removed.');
  return res.redirect('/cart');
};

module.exports = {
  renderCart,
  handleAddToCart,
  handleRemoveFromCart,
  handleApplyCoupon,
  handleRemoveCoupon
};
