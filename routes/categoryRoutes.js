const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { isAuthenticated, authorize } = require('../middleware/authMiddleware');
const { validateCategory } = require('../middleware/validationMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Category Admin Routes
router.get('/categories', isAuthenticated, authorize('category:manage'), asyncHandler(categoryController.renderCategoryIndex));
router.post('/categories', isAuthenticated, authorize('category:manage'), validateCategory, asyncHandler(categoryController.handleCreateCategory));
router.post('/categories/:id/edit', isAuthenticated, authorize('category:manage'), validateCategory, asyncHandler(categoryController.handleUpdateCategory));
router.post('/categories/:id/delete', isAuthenticated, authorize('category:manage'), asyncHandler(categoryController.handleDeleteCategory));

module.exports = router;
