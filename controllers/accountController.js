const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const utilities = require('../utilities/index');
const accountModel = require('../models/account-model');
const pool = require('../database');

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav();
  const { account_email, account_password } = req.body;

  try {
      const accountData = await accountModel.getAccountByEmail(account_email);

      if (!accountData) {
          req.flash("error", "Invalid email or password.");
          return res.status(400).render("account/login", {
              title: "Login",
              nav,
              messages: req.flash(),
              account_email,
          });
      }

      if (await bcrypt.compare(account_password, accountData.account_password)) {
          const tokenPayload = {
              account_id: accountData.account_id,
              account_email: accountData.account_email,
              account_type: accountData.account_type,
              account_firstname: accountData.account_firstname // Include firstname in token
          };

          const accessToken = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

          const cookieOptions = process.env.NODE_ENV === 'production' ?
              { httpOnly: true, secure: true, maxAge: 3600 * 1000 } :
              { httpOnly: true, maxAge: 3600 * 1000 };

          res.cookie("jwt", accessToken, cookieOptions);
          return res.redirect("/account");
      } else {
          req.flash("error", "Invalid email or password.");
          return res.status(400).render("account/login", {
              title: "Login",
              nav,
              messages: req.flash(),
              account_email,
          });
      }
  } catch (error) {
      console.error("Login error:", error);
      req.flash("error", "Something went wrong during login.");
      res.status(500).render("account/login", { title: "Login", nav, messages: req.flash() });
  }
}

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res) {
  let nav = await utilities.getNav();
  res.render("account/login", {
    title: "Login",
    nav,
    messages: { notice: req.flash("notice") },
  });
}

/* ****************************************
 *  Deliver registration view
 * *************************************** */
async function buildRegister(req, res) {
  let nav = await utilities.getNav();
  res.render("account/register", {
    title: "Register",
    nav,
    messages: { notice: req.flash("notice") },
  });
}

/* ****************************************
 *  Process Registration
 * *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav();
  const { account_firstname, account_lastname, account_email, account_password } = req.body;

  try {
    const existingEmail = await accountModel.checkExistingEmail(account_email);
    if (existingEmail) {
      req.flash("notice", "This email is already registered.");
      return res.status(400).render("account/register", {
        title: "Register",
        nav,
        errors: null,
        messages: { notice: req.flash("notice") },
      });
    }

    const hashedPassword = await bcrypt.hash(account_password, 10);
    
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    );

    if (regResult) {
      req.flash("notice", `Congratulations, you're registered ${account_firstname}. Please log in.`);
    } else {
      req.flash("notice", "Sorry, the registration failed.");
    }
  } catch (error) {
    req.flash("notice", "An error occurred during registration. Please try again.");
  }

  res.status(201).render("account/login", { 
    title: "Login", 
    nav,
    messages: { notice: req.flash("notice") },
  });
}

/* ****************************************
 *  Deliver Account Management view
 * *************************************** */
// In accountController.js
async function buildAccountManagement(req, res) {
  let nav = await utilities.getNav();

  if (!req.cookies.jwt) { // Check for JWT cookie directly
      return res.redirect('/account/login');
  }

  try {
      const decodedToken = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);
      const userResult = await pool.query('SELECT * FROM account WHERE account_id = $1', [decodedToken.account_id]); // Use decodedToken.account_id
      const user = userResult.rows[0];

      if (!user) { // Handle the case where the user is not found
          console.error("User not found in database");
          res.clearCookie('jwt');
          return res.redirect('/account/login');
      }

      res.render("account/management", {
          title: "Account Management",
          nav,
          user: user, // Pass the 'user' object to the view
          messages: req.flash(),
      });
  } catch (err) {
      console.error('JWT verification error:', err);
      res.clearCookie('jwt');
      return res.redirect('/account/login');
  }
}

/* ****************************************
 *  Deliver Account Edit view
 * *************************************** */
async function buildEditAccount(req, res) {
  let nav = await utilities.getNav();
  const account_id = req.params.id; // Get the ID from the URL

  try {
      const userResult = await pool.query('SELECT * FROM account WHERE account_id = $1', [account_id]);
      const user = userResult.rows[0];

      if (!user) {
          req.flash("error", "User not found.");
          return res.redirect("/account");
      }

      res.render("account/edit", {
          title: "Edit Account",
          nav,
          user,  // Pass the user data to the view
          messages: req.flash(),
      });
  } catch (error) {
      console.error("Error fetching user for edit:", error);
      req.flash("error", "An error occurred.");
      res.redirect("/account");
  }
}

/* ****************************************
 *  Deliver Account Update view
 * *************************************** */
async function buildAccountUpdate(req, res) {
  let nav = await utilities.getNav();
  const accountId = req.params.id; // Get the account ID from URL

  try {
      const userResult = await pool.query('SELECT * FROM account WHERE account_id = $1', [accountId]);
      const user = userResult.rows[0];

      if (!user) {
          req.flash("error", "User not found.");
          return res.redirect("/account");
      }

      res.render("account/edit", {
          title: "Update Account Information",
          nav,
          user, // Pass user data to the view
          messages: req.flash(),
      });
  } catch (err) {
      console.error("Error fetching account data:", err);
      req.flash("error", "Unable to load account information.");
      res.redirect("/account");
  }
}

/* ****************************************
 *  Process Account Update
 * *************************************** */
async function processAccountUpdate(req, res) {
  let nav = await utilities.getNav();
  const { account_id, account_firstname, account_lastname, account_email } = req.body;

  try {
      // Check if email is already in use by another account
      const existingUser = await accountModel.getAccountByEmail(account_email);
      if (existingUser && existingUser.account_id !== parseInt(account_id)) {
          req.flash("error", "This email is already in use by another account.");
          return res.redirect(`/account/edit/${account_id}`);
      }

      // Update the account information
      const updateResult = await accountModel.updateAccount(
          account_id,
          account_firstname,
          account_lastname,
          account_email
      );

      if (updateResult) {
          req.flash("success", "Account updated successfully.");
          return res.redirect("/account");  // ✅ Redirect to account management
      } else {
          req.flash("error", "Account update failed.");
          return res.redirect(`/account/edit/${account_id}`);  // ✅ Redirect back to edit page
      }
  } catch (error) {
      console.error("Account update error:", error);
      req.flash("error", "Something went wrong while updating your account.");
      return res.redirect(`/account/edit/${account_id}`);  // ✅ Redirect instead of rendering
  }
}

/* ****************************************
 *  Process Logout
 * *************************************** */
async function logout(req, res) {
  res.clearCookie("jwt");
  req.flash("notice", "You have been logged out successfully.");
  res.redirect("/account/login");
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildAccountManagement,
  buildAccountUpdate,  
  processAccountUpdate,
  logout
};

