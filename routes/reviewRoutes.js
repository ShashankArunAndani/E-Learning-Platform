const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { validateReview } = require('../middleware/validationMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.post('/courses/:id/reviews', isAuthenticated, validateReview, asyncHandler(reviewController.handleCreateReview));

module.exports = router;
