const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');

/**
 * Initiate checkout transaction: create pending Order from Cart
 */
const handleInitiateCheckout = async (req, res) => {
  const userId = req.session.user.user_id;
  const cartSummary = await Cart.getCartSummary(userId);

  if (!cartSummary.items || cartSummary.items.length === 0) {
    req.flash('error_msg', 'Your cart is empty. Add courses before checking out.');
    return res.redirect('/cart');
  }

  let couponId = null;
  let discountAmount = 0;
  const appliedCoupon = req.session.applied_coupon;

  if (appliedCoupon) {
    const valResult = await Coupon.validateCoupon(appliedCoupon.code, cartSummary.subtotal);
    if (valResult.valid) {
      couponId = valResult.coupon.coupon_id;
      discountAmount = valResult.discount_amount;
    } else {
      req.session.applied_coupon = null;
    }
  }

  const totalAmount = Math.max(0, parseFloat((cartSummary.subtotal - discountAmount).toFixed(2)));

  // Start Transaction & Create Order
  const orderId = await Order.createOrderFromCart({
    userId,
    couponId,
    subtotalAmount: cartSummary.subtotal,
    discountAmount,
    totalAmount,
    cartId: cartSummary.cart_id,
    items: cartSummary.items
  });

  // Clear session coupon
  req.session.applied_coupon = null;

  await ActivityLog.logAction(userId, 'CHECKOUT_INITIATED', req.ip, { orderId, totalAmount });

  return res.redirect(`/checkout/${orderId}`);
};

/**
 * Render sandbox test payment gateway page
 */
const renderCheckoutPage = async (req, res) => {
  const orderId = parseInt(req.params.order_id, 10);
  const order = await Order.findById(orderId);

  if (!order) {
    req.flash('error_msg', 'Order not found.');
    return res.redirect('/courses');
  }

  const userId = req.session.user.user_id;
  if (order.user_id !== userId && req.session.user.role_name !== 'Admin') {
    req.flash('error_msg', 'Access Denied: You do not own this order.');
    return res.redirect('/dashboard');
  }

  if (order.status === 'completed') {
    return res.redirect(`/orders/${orderId}/success`);
  }

  res.render('checkout/index', {
    title: `Checkout Order #${orderId} — E-Learning Platform`,
    order,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Process test gateway payment (success or failure simulation)
 */
const handleProcessPayment = async (req, res) => {
  const orderId = parseInt(req.params.order_id, 10);
  const order = await Order.findById(orderId);

  if (!order) {
    req.flash('error_msg', 'Order not found.');
    return res.redirect('/courses');
  }

  const userId = req.session.user.user_id;
  if (order.user_id !== userId && req.session.user.role_name !== 'Admin') {
    req.flash('error_msg', 'Access Denied: You do not own this order.');
    return res.redirect('/dashboard');
  }

  const { payment_method = 'card', simulate_outcome = 'success' } = req.body;
  const isSuccess = simulate_outcome === 'success';

  // Generate unique transaction reference
  const txnRef = `TXN_SANDBOX_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  // Execute payment transaction & auto-enrollment
  const result = await Payment.processPaymentAndEnroll({
    orderId,
    amount: order.total_amount,
    paymentMethod: payment_method,
    transactionRef: txnRef,
    isSuccess
  });

  await ActivityLog.logAction(userId, 'PAYMENT_ATTEMPT', req.ip, {
    orderId,
    amount: order.total_amount,
    status: result.status,
    txnRef
  });

  if (isSuccess) {
    req.flash('success_msg', 'Payment processing completed successfully! Your courses are now enrolled.');
    return res.redirect(`/orders/${orderId}/success`);
  } else {
    req.flash('error_msg', 'Payment processing failed. Your card was not charged. You can retry your payment below.');
    return res.redirect(`/checkout/${orderId}`);
  }
};

/**
 * Render order completion confirmation receipt
 */
const renderOrderSuccess = async (req, res) => {
  const orderId = parseInt(req.params.order_id, 10);
  const order = await Order.findById(orderId);

  if (!order) {
    req.flash('error_msg', 'Order not found.');
    return res.redirect('/dashboard');
  }

  const userId = req.session.user.user_id;
  if (order.user_id !== userId && req.session.user.role_name !== 'Admin') {
    req.flash('error_msg', 'Access Denied: You do not own this order.');
    return res.redirect('/dashboard');
  }

  res.render('orders/success', {
    title: `Order #${orderId} Receipt — E-Learning Platform`,
    order,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Render student order history page
 */
const getUserOrders = async (req, res) => {
  const userId = req.session.user.user_id;
  const orders = await Order.getUserOrders(userId);

  res.render('orders/index', {
    title: 'Order History — E-Learning Platform',
    orders,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

module.exports = {
  handleInitiateCheckout,
  renderCheckoutPage,
  handleProcessPayment,
  renderOrderSuccess,
  getUserOrders
};
