const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

const handleCertificateRequest = async (req, res) => {
  const courseId = parseInt(req.params.id, 10);
  const userId = req.session.user.user_id;

  try {
    const certificate = await Certificate.issueIfEligible(userId, courseId);
    if (certificate.wasIssued) {
      const course = await Course.findById(courseId);
      await Notification.createInApp(
        userId,
        `Your certificate for ${course ? course.title : 'your completed course'} has been issued.`,
        'certificate',
        'high'
      );
    }
    req.flash('success_msg', 'Certificate issued. It is ready to verify or print.');
    return res.redirect(`/certificate/${certificate.certificate_url}`);
  } catch (error) {
    req.flash('error_msg', error.message || 'Unable to issue certificate.');
    return res.redirect(`/courses/${courseId}`);
  }
};

const renderCertificate = async (req, res) => {
  const certificate = await Certificate.findByUrl(req.params.certificate_url);

  if (!certificate) {
    return res.status(404).render('error', {
      title: 'Certificate Not Found',
      message: 'No certificate was found for this verification URL.',
      error: { status: 404 }
    });
  }

  res.render('certificates/show', {
    title: `Certificate — ${certificate.course_title}`,
    certificate,
    user: req.session ? req.session.user : null
  });
};

module.exports = {
  handleCertificateRequest,
  renderCertificate
};
