const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.post('/courses/:id/certificate', isAuthenticated, asyncHandler(certificateController.handleCertificateRequest));
router.get('/certificate/:certificate_url', asyncHandler(certificateController.renderCertificate));

module.exports = router;
