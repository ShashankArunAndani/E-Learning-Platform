const Role = require('../models/Role');

/**
 * Middleware ensuring user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error_msg', 'Please log in to access this page.');
  return res.redirect('/login');
};

/**
 * Middleware ensuring user has the required permission(s)
 * @param  {...string} requiredPermissions
 */
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error_msg', 'Please log in to perform this action.');
      return res.redirect('/login');
    }

    const { role_id } = req.session.user;

    try {
      // Fetch permissions for current user's role
      const userPermissions = await Role.getPermissionsByRoleId(role_id);

      // Check if user has ALL required permissions
      const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));

      if (hasPermission) {
        return next();
      }

      // If missing required permission
      res.status(403);
      if (req.accepts('html')) {
        return res.render('error', {
          title: '403 Forbidden',
          message: 'Access Denied: You do not have permission to view this resource.',
          error: { status: 403 }
        });
      }
      return res.json({ error: 'Access Denied: Insufficient permissions' });
    } catch (err) {
      return next(err);
    }
  };
};

module.exports = {
  isAuthenticated,
  authorize
};
