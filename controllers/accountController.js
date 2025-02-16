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
    console.log("Account Data Retrieved:", accountData);  // Debugging log

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
      // Login successful, generate JWT token and set cookies
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      console.log("Generated Access Token:", accessToken);  // Debugging log

      // Set token as a cookie
      const cookieOptions = process.env.NODE_ENV === 'development' ? 
        { httpOnly: true, maxAge: 3600 * 1000 } : 
        { httpOnly: true, secure: true, maxAge: 3600 * 1000 };

      res.cookie("jwt", accessToken, cookieOptions);
      console.log('Redirecting to account management...');
      return res.redirect("/account/management");  // Ensure this route is correct for Account Management page
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
  
  // Decode the JWT to get the logged-in user
  const token = req.cookies.jwt;
  let user = null;

  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (!err && decoded) {
        user = decoded; // Set user data from the token
      }
    });
  }

  res.render("account/login", {
    title: "Login",
    nav,
    user,  // Pass the user object to the view
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
  console.log("✅ Received registration request:", req.body); // Debugging log
  let nav = await utilities.getNav();
  const { account_firstname, account_lastname, account_email, account_password } = req.body;

  try {
    // Check if email already exists
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

    // Hash the password before storing
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(account_password, 10); // 10 is the salt rounds
    } catch (error) {
      req.flash("notice", "Sorry, there was an error processing the registration.");
      return res.status(500).render("account/register", {
        title: "Registration",
        nav,
        errors: null,
        messages: { notice: req.flash("notice") },
      });
    }

    // Register the new account
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword // Use hashedPassword instead of plain account_password
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

  // 🔴 Log flash messages before rendering the page
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

  // Ensure you have user data from the JWT token
  const token = req.cookies.jwt;
  if (!token) {
    return res.redirect('/account/login'); // Redirect to login if no token
  }

  // Decode the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.redirect('/account/login');
    }
    
    // Log the decoded token to check its structure
    console.log('Decoded JWT:', decoded);

    // Get user data from the token
    const user = decoded;

    // Render the account management page with the user data
    res.render("account/management", {
      title: "Account Management",
      nav,
      user,  // Pass the user data to the view
      notice: req.flash("notice"),
    });
  });
}

module.exports = { buildLogin, buildRegister, registerAccount, accountLogin, buildAccountManagement };