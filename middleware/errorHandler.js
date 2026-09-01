/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Always log server-side detail
  console.error('Unhandled Error caught in centralized middleware:', {
    message: err.message,
    code: err.code,
    errno: err.errno,
    sqlState: err.sqlState,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  const isProduction = process.env.NODE_ENV === 'production';

  // Handle specific MySQL Database Errors gracefully
  let userMessage = 'An unexpected error occurred. Please try again later.';
  let statusCode = err.status || err.statusCode || 500;

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 400;
    if (err.message.includes('uk_users_email')) {
      userMessage = 'An account with this email address already exists.';
    } else {
      userMessage = 'A duplicate entry was detected. Please check your data.';
    }
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    userMessage = 'Referenced resource does not exist.';
  }

  // Render error page or return JSON depending on request type
  res.status(statusCode);

  if (req.accepts('html')) {
    return res.render('error', {
      title: `${statusCode} Server Error`,
      message: isProduction ? userMessage : (err.message || userMessage),
      error: isProduction ? { status: statusCode } : err
    });
  }

  return res.json({
    error: {
      message: isProduction ? userMessage : err.message,
      status: statusCode
    }
  });
};

module.exports = errorHandler;
