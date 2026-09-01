const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.get('/wishlist', isAuthenticated, asyncHandler(wishlistController.renderWishlist));
router.post('/wishlist/add', isAuthenticated, asyncHandler(wishlistController.handleAddToWishlist));
router.post('/wishlist/remove', isAuthenticated, asyncHandler(wishlistController.handleRemoveFromWishlist));

module.exports = router;
