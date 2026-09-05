const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.get('/notifications', isAuthenticated, asyncHandler(notificationController.getNotifications));
router.post('/notifications/read-all', isAuthenticated, asyncHandler(notificationController.markAllNotificationsRead));
router.post('/notifications/:notification_id/read', isAuthenticated, asyncHandler(notificationController.markNotificationRead));

module.exports = router;
