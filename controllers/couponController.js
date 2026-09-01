const Coupon = require('../models/Coupon');
const ActivityLog = require('../models/ActivityLog');

/**
 * Render admin coupon management workspace
 */
const renderCoupons = async (req, res) => {
  const coupons = await Coupon.getAll();

  res.render('coupons/index', {
    title: 'Manage Coupons — Admin',
    coupons,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Handle new coupon creation
 */
const handleCreateCoupon = async (req, res) => {
  const {
    code,
    discount_type,
    discount_value,
    max_discount_amount,
    min_order_amount,
    valid_from,
    valid_to,
    usage_limit
  } = req.body;

  const existing = await Coupon.findByCode(code);
  if (existing) {
    req.flash('error_msg', `Coupon code "${code.toUpperCase()}" already exists.`);
    return res.redirect('/coupons');
  }

  const couponId = await Coupon.create({
    code,
    discount_type,
    discount_value: parseFloat(discount_value),
    max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
    min_order_amount: min_order_amount ? parseFloat(min_order_amount) : 0,
    valid_from,
    valid_to,
    usage_limit: usage_limit ? parseInt(usage_limit, 10) : null
  });

  await ActivityLog.logAction(req.session.user.user_id, 'COUPON_CREATED', req.ip, { couponId, code });

  req.flash('success_msg', `Coupon "${code.toUpperCase()}" created successfully.`);
  return res.redirect('/coupons');
};

/**
 * Toggle coupon active status
 */
const handleToggleCouponStatus = async (req, res) => {
  const couponId = parseInt(req.params.id, 10);

  await Coupon.toggleStatus(couponId);
  await ActivityLog.logAction(req.session.user.user_id, 'COUPON_STATUS_TOGGLED', req.ip, { couponId });

  req.flash('success_msg', 'Coupon status updated.');
  return res.redirect('/coupons');
};

module.exports = {
  renderCoupons,
  handleCreateCoupon,
  handleToggleCouponStatus
};
