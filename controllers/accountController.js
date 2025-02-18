const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const utilities = require('../utilities/index');
const accountModel = require('../models/account-model');

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav();
  const { account_email, account_password } = req.body;

  try {
    const accountData = await accountModel.getAccountByEmail(account_email);
    console.log("Account Data Retrieved:", accountData);

    if (!accountData) {
      req.flash("notice", "Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
        messages: req.flash("notice"),
      });
    }

    if (await bcrypt.compare(account_password, accountData.account_password)) {
      const tokenPayload = {
        account_id: accountData.account_id,
        account_email: accountData.account_email,
        account_type: accountData.account_type
      };
      
      const accessToken = jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      console.log("Generated Access Token:", accessToken);

      const cookieOptions = process.env.NODE_ENV === 'production' ? 
        { httpOnly: true, secure: true, maxAge: 3600 * 1000 } : 
        { httpOnly: true, maxAge: 3600 * 1000 };

      res.cookie("jwt", accessToken, cookieOptions);
      console.log('Redirecting to account management...');
      return res.redirect("/account/management");
    } else {
      req.flash("notice", "Invalid credentials.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
        messages: req.flash("notice"),
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    req.flash("notice", "Something went wrong during login.");
    res.status(500).render("account/login", { title: "Login", nav, errors: null });
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
  console.log("✅ Received registration request:", req.body);
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
      console.log("✅ Registration successful:", regResult.rows[0]);
      req.flash("notice", `Congratulations, you're registered ${account_firstname}. Please log in.`);
    } else {
      console.log("❌ Registration failed");
      req.flash("notice", "Sorry, the registration failed.");
    }
  } catch (error) {
    console.error("❌ Error during registration:", error.message);
    req.flash("notice", "An error occurred during registration. Please try again.");
  }

  console.log("🔍 Flash messages before render:", req.flash("notice"));

  res.status(201).render("account/login", { 
    title: "Login", 
    nav,
    messages: { notice: req.flash("notice") },
  });
}

/* ****************************************
 *  Deliver Account Management view
 * *************************************** */
async function buildAccountManagement(req, res) {
  let nav = await utilities.getNav();
  const token = req.cookies.jwt;
  if (!token) {
    return res.redirect('/account/login');
  }

  try {
    const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log('Decoded JWT:', user);
    res.render("account/management", {
      title: "Account Management",
      nav,
      user,
      notice: req.flash("notice"),
    });
  } catch (err) {
    console.error('JWT verification error:', err);
    return res.redirect('/account/login');
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

module.exports = { buildLogin, buildRegister, registerAccount, accountLogin, buildAccountManagement, logout };
