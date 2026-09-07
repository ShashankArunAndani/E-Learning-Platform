const Role = require('../models/Role');
const InstructorProfile = require('../models/InstructorProfile');
const ActivityLog = require('../models/ActivityLog');
const Metric = require('../models/Metric');

/**
 * Main dashboard view
 */
const renderDashboard = async (req, res) => {
  const user = req.session.user;
  const permissions = await Role.getPermissionsByRoleId(user.role_id);

  let instructorData = null;
  if (user.role_name === 'Instructor') {
    instructorData = await InstructorProfile.getByInstructorId(user.user_id);
  }

  res.render('dashboard', {
    title: `${user.role_name} Dashboard — E-Learning Platform`,
    user,
    permissions,
    instructorData,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Instructor dedicated panel
 */
const renderInstructorDashboard = async (req, res) => {
  const user = req.session.user;
  const instructorData = await InstructorProfile.getByInstructorId(user.user_id);

  res.render('dashboard', {
    title: 'Instructor Workspace — E-Learning Platform',
    user,
    permissions: await Role.getPermissionsByRoleId(user.role_id),
    instructorData,
    panelMode: 'instructor',
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Admin dedicated panel
 */
const renderAdminDashboard = async (req, res) => {
  const user = req.session.user;
  const [recentLogs, metricsSummary] = await Promise.all([
    ActivityLog.getRecentLogs(15),
    Metric.getAdminSummary()
  ]);

  res.render('dashboard', {
    title: 'Admin Control Center — E-Learning Platform',
    user,
    permissions: await Role.getPermissionsByRoleId(user.role_id),
    recentLogs,
    metrics: metricsSummary,
    panelMode: 'admin',
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

module.exports = {
  renderDashboard,
  renderInstructorDashboard,
  renderAdminDashboard
};
