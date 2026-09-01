const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.post('/checkout/initiate', isAuthenticated, asyncHandler(checkoutController.handleInitiateCheckout));
router.get('/checkout/:order_id', isAuthenticated, asyncHandler(checkoutController.renderCheckoutPage));
router.post('/checkout/:order_id/pay', isAuthenticated, asyncHandler(checkoutController.handleProcessPayment));
router.get('/orders/:order_id/success', isAuthenticated, asyncHandler(checkoutController.renderOrderSuccess));
router.get('/orders', isAuthenticated, asyncHandler(checkoutController.getUserOrders));

module.exports = router;
