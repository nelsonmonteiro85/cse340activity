const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
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
    const { account_firstname, account_lastname, account_email, account_password } = req.body;

    try {
      const existingAccount = await pool.query('SELECT * FROM account WHERE account_email = $1', [account_email]);

      if (existingAccount.rows.length > 0) {
        req.flash('notice', 'Email is already registered!');
        return res.redirect('/account/register');
      }

      const hashedPassword = await bcrypt.hash(account_password, 10);
      await accountController.registerAccount(account_firstname, account_lastname, account_email, hashedPassword);

      req.flash('notice', 'Account successfully created! Please log in.');
      res.redirect('/account/login');
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
    const { account_email, account_password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM account WHERE account_email = $1', [account_email]);
      if (result.rows.length === 0) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/account/login');
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(account_password, user.account_password);
      if (!passwordMatch) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/account/login');
      }

      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.cookie("jwt", accessToken, { httpOnly: true, secure: process.env.NODE_ENV !== 'development', maxAge: 3600 * 1000 });

      req.flash('notice', 'Logged in successfully');
      res.redirect('/account');
    } catch (error) {
      console.error(error);
      req.flash('error', 'Something went wrong, please try again.');
      res.redirect('/account/login');
    }
  })
);

// Route to build the account management view
router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.buildAccountManagement));

module.exports = router;
