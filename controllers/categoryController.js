const Category = require('../models/Category');
const ActivityLog = require('../models/ActivityLog');

/**
 * Admin view to list and manage categories
 */
const renderCategoryIndex = async (req, res) => {
  const categories = await Category.getAll();
  res.render('categories/index', {
    title: 'Manage Categories — Admin',
    categories,
    user: req.session.user,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

/**
 * Handle new category creation
 */
const handleCreateCategory = async (req, res) => {
  const { category_name, description } = req.body;

  const existing = await Category.findByName(category_name);
  if (existing) {
    req.flash('error_msg', `Category "${category_name}" already exists.`);
    return res.redirect('/categories');
  }

  const categoryId = await Category.create({ category_name, description });
  await ActivityLog.logAction(req.session.user.user_id, 'CATEGORY_CREATED', req.ip, { categoryId, category_name });

  req.flash('success_msg', `Category "${category_name}" created successfully.`);
  return res.redirect('/categories');
};

/**
 * Handle category update
 */
const handleUpdateCategory = async (req, res) => {
  const categoryId = parseInt(req.params.id, 10);
  const { category_name, description } = req.body;

  await Category.update(categoryId, { category_name, description });
  await ActivityLog.logAction(req.session.user.user_id, 'CATEGORY_UPDATED', req.ip, { categoryId, category_name });

  req.flash('success_msg', 'Category updated successfully.');
  return res.redirect('/categories');
};

/**
 * Handle category deletion
 */
const handleDeleteCategory = async (req, res) => {
  const categoryId = parseInt(req.params.id, 10);

  await Category.delete(categoryId);
  await ActivityLog.logAction(req.session.user.user_id, 'CATEGORY_DELETED', req.ip, { categoryId });

  req.flash('success_msg', 'Category deleted successfully.');
  return res.redirect('/categories');
};

module.exports = {
  renderCategoryIndex,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory
};
