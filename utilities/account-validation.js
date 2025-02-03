const utilities = require(".");
const { body, validationResult } = require("express-validator");

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
    
    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),
    
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
 *  Check data and return errors or continue to registration
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

module.exports = validate;
