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
      res.redirect('/account/'); // Redirect to the account management page after successful registration
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
  utilities.handleErrors(accountController.accountLogin)
);

// ✅ UPDATED: Route to build the account management view ("/account/") with checkLogin middleware
router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountManagement));

module.exports = router;
