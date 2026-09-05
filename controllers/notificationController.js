const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  const userId = req.session.user.user_id;
  const notifications = await Notification.getForUser(userId);

  res.render('notifications/index', {
    title: 'Notifications — E-Learning Platform',
    notifications,
    user: req.session.user
  });
};

const markNotificationRead = async (req, res) => {
  const notificationId = parseInt(req.params.notification_id, 10);
  const userId = req.session.user.user_id;

  await Notification.markAsRead(notificationId, userId);
  req.flash('success_msg', 'Notification marked as read.');
  return res.redirect('/notifications');
};

const markAllNotificationsRead = async (req, res) => {
  const userId = req.session.user.user_id;

  await Notification.markAllAsRead(userId);
  req.flash('success_msg', 'All notifications marked as read.');
  return res.redirect('/notifications');
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
