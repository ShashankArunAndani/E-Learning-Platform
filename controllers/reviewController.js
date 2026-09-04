const { validationResult } = require('express-validator');
const Review = require('../models/Review');

const handleCreateReview = async (req, res) => {
  const errors = validationResult(req);
  const courseId = parseInt(req.params.id, 10);

  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array().map(error => error.msg).join(' '));
    return res.redirect(`/courses/${courseId}#reviews`);
  }

  try {
    // DFD-2.11 (9.10-9.12): verify enrollment, validate rating/comment, store one review per user/course.
    await Review.create(
      req.session.user.user_id,
      courseId,
      parseInt(req.body.rating, 10),
      req.body.comment ? req.body.comment.trim() : null
    );
    req.flash('success_msg', 'Thank you. Your review has been added to this course.');
  } catch (error) {
    req.flash('error_msg', error.message || 'Unable to save your review.');
  }

  return res.redirect(`/courses/${courseId}#reviews`);
};

module.exports = {
  handleCreateReview
};
