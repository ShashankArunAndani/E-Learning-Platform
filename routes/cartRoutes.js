const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.get('/cart', isAuthenticated, asyncHandler(cartController.renderCart));
router.post('/cart/add', isAuthenticated, asyncHandler(cartController.handleAddToCart));
router.post('/cart/remove', isAuthenticated, asyncHandler(cartController.handleRemoveFromCart));
router.post('/cart/coupon', isAuthenticated, asyncHandler(cartController.handleApplyCoupon));
router.post('/cart/coupon/remove', isAuthenticated, asyncHandler(cartController.handleRemoveCoupon));

module.exports = router;
