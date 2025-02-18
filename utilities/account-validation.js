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

/* ***********************************
 *  Update Account Data Validation Rules
 * ********************************* */
validate.updateRules = () => {
  return [
    body('account_firstname').trim().notEmpty().withMessage('First name is required'),
    body('account_lastname').trim().notEmpty().withMessage('Last name is required'),
    body('account_email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format')
      .custom(async (account_email, {req}) => { //check if the email is already in use by another account
          const existingAccount = await accountModel.getAccountByEmail(account_email);
          if (existingAccount && existingAccount.account_id != req.body.account_id) {
              throw new Error('Email already in use by another account!');
          }
      }),
  ];
};

validate.checkUpdateData = async (req, res, next) => {
    const { account_id, account_firstname, account_lastname, account_email } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors.array().map(error => error.msg);
      let nav = await utilities.getNav();
      const userResult = await pool.query('SELECT * FROM account WHERE account_id = $1', [account_id]);
      const user = userResult.rows[0];

      return res.render("account/edit", {
        title: "Edit Account",
        nav,
        user: user,
        errors: messages,
        messages: req.flash(),
      });
    }
    next();
};

/* ***********************************
 *  Change Password Validation Rules
 * ********************************* */
validate.passwordRules = () => {
  return [
    body('account_password')
      .trim()
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
      .withMessage('Password must contain at least 1 uppercase character, 1 lowercase character, 1 number, and 1 special character'),
  ];
};

validate.checkPasswordData = async (req, res, next) => {
  const { account_id, account_password } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map(error => error.msg);
    let nav = await utilities.getNav();
    const userResult = await pool.query('SELECT * FROM account WHERE account_id = $1', [account_id]);
    const user = userResult.rows[0];

    return res.render("account/edit", {
      title: "Edit Account",
      nav,
      user: user,
      errors: messages,
      messages: req.flash(),
    });
  }
  next();
};

module.exports = validate;
