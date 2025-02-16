const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/index");
const validate = require("../utilities/account-validation");
const pool = require('../database');

// Route to build login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Route to build registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Route to handle registration form submission with validation
router.post(
  "/register",
  validate.registrationRules(),
  validate.checkRegistrationData,
  utilities.handleErrors(async (req, res) => {
    const { email, password, username } = req.body;

    // Check if the email is already registered
    try {
      const existingAccount = await pool.query('SELECT * FROM account WHERE account_email = $1', [email]);

      if (existingAccount.rows.length > 0) {
        // Email is already taken, set a flash message and redirect to the registration page
        req.flash('notice', 'Email is already registered!');
        return res.redirect('/account/register');
      }

      // Proceed with account registration
      await accountController.registerAccount(req, res);

      // Set a success flash message after account creation
      req.flash('notice', 'Account successfully created!');
      res.redirect('/account/login'); // Redirect to the login page after successful registration
    } catch (error) {
      console.error(error);
      req.flash('error', 'Something went wrong, please try again.');
      return res.redirect('/account/register');
    }
  })
);

// Process login request
router.post(
  "/login",
  validate.loginRules(),
  validate.checkLoginData,
  utilities.handleErrors(async (req, res) => {
    const { email, password } = req.body;

    try {
      const result = await pool.query('SELECT * FROM account WHERE account_email = $1', [email]);

      if (result.rows.length === 0) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/account/login');
      }

      const user = result.rows[0];

      // Password validation (make sure to hash passwords in real implementation)
      if (user.account_password !== password) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/account/login');
      }

      // Login successful - store user session
      req.session.user = {
        id: user.account_id,
        email: user.account_email,
        username: user.account_username,
      };

      req.flash('notice', 'Logged in successfully');
      res.redirect('/account'); // Redirect to account management page after successful login
    } catch (error) {
      console.error(error);
      req.flash('error', 'Something went wrong, please try again.');
      res.redirect('/account/login');
    }
  })
);

// Route to build the account management view ("/account/") with checkLogin middleware
router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountManagement));

module.exports = router;
