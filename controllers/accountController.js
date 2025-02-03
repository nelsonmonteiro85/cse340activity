const bcrypt = require("bcryptjs");

const utilities = require('../utilities/index');
const accountModel = require('../models/account-model');

/* ****************************************
*  Function to deliver login view
* *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/login", {
    title: "Login",
    nav,
  });
}

/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/register", {
    title: "Register",
    nav,
  });
}

/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  console.log("✅ Received registration request:", req.body); // Debugging log
  let nav = await utilities.getNav();
  const { account_firstname, account_lastname, account_email, account_password } = req.body;

  // Hash the password before storing
  let hashedPassword;
  try {
    // Hash password with salt rounds of 10
    hashedPassword = await bcrypt.hash(account_password, 10); // 10 is the salt rounds
  } catch (error) {
    req.flash("notice", 'Sorry, there was an error processing the registration.');
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    });
    return; // Stop further execution
  }

  try {
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

  res.status(201).render("account/login", { title: "Login", nav });
}

module.exports = { buildLogin, buildRegister, registerAccount };
