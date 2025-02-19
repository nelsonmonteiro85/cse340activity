const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// Route to display the feedback form
router.get('/feedback', feedbackController.renderFeedbackForm);

// Route to handle form submission
router.post('/feedback', feedbackController.submitFeedback);

module.exports = router;
