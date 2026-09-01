/**
 * Landing Page controller
 */
const renderHome = (req, res) => {
  res.render('index', {
    title: 'E-Learning Platform — Rigorous, Verifiable Learning Credentials',
    user: req.session ? req.session.user : null,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
};

module.exports = {
  renderHome
};
