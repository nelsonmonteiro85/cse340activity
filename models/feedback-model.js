const feedbackModel = require('../models/feedback-model');

// Controller to render the feedback form
exports.renderFeedbackForm = (req, res) => {
    res.render('feedback/form', { title: 'Submit Feedback' });
};

// Controller to handle the form submission
exports.submitFeedback = async (req, res) => {
    const { user_id, feedback_text } = req.body;

    // Validate input
    if (!user_id || !feedback_text) {
        req.flash('error', 'User ID and feedback text are required.');
        return res.redirect('/feedback');
    }

    try {
        // Save feedback to the database
        await feedbackModel.saveFeedback(user_id, feedback_text);

        req.flash('success', 'Thank you for your feedback!');
        res.redirect('/feedback');
    } catch (error) {
        console.error('Error submitting feedback:', error);
        req.flash('error', 'An error occurred while submitting your feedback. Please try again.');
        res.redirect('/feedback');
    }
};
