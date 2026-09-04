const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  
  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password.');
      }
      return true;
    }),

  body('role')
    .trim()
    .notEmpty().withMessage('Role selection is required.')
    .isIn(['Student', 'Instructor']).withMessage('Role must be either Student or Instructor.'),
  
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isMobilePhone().withMessage('Please provide a valid phone number.')
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required.')
];

const validateCourse = [
  body('title')
    .trim()
    .notEmpty().withMessage('Course title is required.')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters.'),

  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a valid number greater than or equal to 0.'),

  body('duration')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Duration must be a positive integer.'),

  body('level')
    .trim()
    .notEmpty().withMessage('Course level is required.')
    .isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level selected.'),

  body('status')
    .trim()
    .optional()
    .isIn(['draft', 'published', 'archived']).withMessage('Invalid status selected.')
];

const validateCategory = [
  body('category_name')
    .trim()
    .notEmpty().withMessage('Category name is required.')
    .isLength({ max: 100 }).withMessage('Category name cannot exceed 100 characters.')
];

const validateLesson = [
  body('title')
    .trim()
    .notEmpty().withMessage('Lesson title is required.')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters.'),

  body('content_type')
    .trim()
    .notEmpty().withMessage('Content type is required.')
    .isIn(['video', 'document', 'quiz', 'other']).withMessage('Invalid content type.'),

  body('content_url')
    .trim()
    .notEmpty().withMessage('Content URL or path is required.'),

  body('duration')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Duration must be a non-negative integer.'),

  body('order_index')
    .notEmpty().withMessage('Order index is required.')
    .isInt({ min: 1 }).withMessage('Order index must be a positive integer.')
];

const validateCouponForm = [
  body('code')
    .trim()
    .notEmpty().withMessage('Coupon code is required.')
    .isLength({ max: 50 }).withMessage('Code cannot exceed 50 characters.'),

  body('discount_type')
    .trim()
    .notEmpty().withMessage('Discount type is required.')
    .isIn(['flat', 'percent']).withMessage('Discount type must be flat or percent.'),

  body('discount_value')
    .notEmpty().withMessage('Discount value is required.')
    .isFloat({ min: 0.01 }).withMessage('Discount value must be greater than 0.'),

  body('valid_from')
    .notEmpty().withMessage('Valid from date is required.'),

  body('valid_to')
    .notEmpty().withMessage('Valid to date is required.')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.valid_from)) {
        throw new Error('Valid to date must be after Valid from date.');
      }
      return true;
    })
];

const validateReview = [
  body('rating')
    .notEmpty().withMessage('Rating is required.')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),

  body('comment')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Review comment cannot exceed 1000 characters.')
];

/**
 * Helper middleware to check validation results and handle errors
 */
const handleValidationErrors = (viewName, titleName) => {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg);
      req.flash('error_msg', errorMessages.join(' '));
      return res.render(viewName, {
        title: titleName,
        formData: req.body,
        error_msg: req.flash('error_msg')
      });
    }
    next();
  };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCourse,
  validateCategory,
  validateLesson,
  validateCouponForm,
  validateReview,
  handleValidationErrors
};
