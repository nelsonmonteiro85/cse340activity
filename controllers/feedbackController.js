const pool = require('../database');

// Handle GET request to display the feedback form
exports.renderFeedbackForm = (req, res) => {
    // Pass the flash messages from the session
    res.render('feedback/feedbackForm', {
        title: 'Submit Feedback',
        messages: req.flash() // Get all flash messages
    });
};

// Handle POST request to process feedback
exports.submitFeedback = async (req, res) => {
    try {
        const { name, email, feedback_text } = req.body;

        // Validate input
        if (!name || !email || !feedback_text) {
            req.flash('error', 'All fields are required.');
            return res.redirect('/feedback');
        }

        // Insert feedback into database using parameterized query
        const query = 'INSERT INTO feedback (name, email, feedback_text) VALUES ($1, $2, $3)';
        const values = [name.trim(), email.trim(), feedback_text.trim()];
        await pool.query(query, values);

        // Success message after submission
        req.flash('success', 'Thank you for your feedback!');
        res.redirect('/feedback');
    } catch (error) {
        console.error('Error submitting feedback:', error);
        req.flash('error', 'There was an error submitting your feedback. Please try again.');
        res.redirect('/feedback');
    }
};
