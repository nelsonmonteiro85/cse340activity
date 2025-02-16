const utilities = require(".");
const { body, validationResult } = require("express-validator");
const accountModel = require("../models/account-model"); // Require account model for email check

const validate = {};

/*  **********************************
 *  Registration Data Validation Rules
 * ********************************* */
validate.registrationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),
    
    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."),
    
    // valid email is required and cannot already exist in the database
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail() // refer to validator.js docs
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email);
        if (emailExists) {
          throw new Error("Email exists. Please log in or use a different email");
        }
      }),
    
    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password must be at least 12 characters long and include at least one uppercase letter, one number, and one special character."),
  ];
};

/*  **********************************
 *  Login Data Validation Rules  ✅ (Added)
 * ********************************* */
validate.loginRules = () => {
  return [
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address."),

    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required."),
  ];
};

/*  **********************************
 *  Check registration data
 * ********************************* */
validate.checkRegistrationData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map(error => error.msg);
    let nav = await utilities.getNav();

    return res.render("account/register", {
      title: "Registration",
      nav,
      errors: messages,  // Send error messages to the view
      account_firstname,  // Maintain stickiness
      account_lastname,   // Maintain stickiness
      account_email,      // Maintain stickiness
    });
  }
  next();
};

/*  **********************************
 *  Check login data  ✅ (Added)
 * ********************************* */
validate.checkLoginData = async (req, res, next) => {
  const { account_email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map(error => error.msg);
    let nav = await utilities.getNav();

    return res.render("account/login", {
      title: "Login",
      nav,
      errors: messages,  // Send error messages to the view
      account_email,     // Maintain email input stickiness
    });
  }
  next();
};

module.exports = validate;
