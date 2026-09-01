const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { isAuthenticated, authorize } = require('../middleware/authMiddleware');
const { validateCouponForm } = require('../middleware/validationMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.get('/coupons', isAuthenticated, authorize('coupon:manage'), asyncHandler(couponController.renderCoupons));
router.post('/coupons', isAuthenticated, authorize('coupon:manage'), validateCouponForm, asyncHandler(couponController.handleCreateCoupon));
router.post('/coupons/:id/toggle', isAuthenticated, authorize('coupon:manage'), asyncHandler(couponController.handleToggleCouponStatus));

module.exports = router;
