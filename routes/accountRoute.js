const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/index");
const validate = require("../utilities/account-validation");

// Route to build login view (this is for the login page)
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Route to build registration view (this is for the registration page)
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Route to handle registration form submission with validation
router.post(
    "/register",
    validate.registrationRules(),
    validate.checkRegistrationData,
    utilities.handleErrors(accountController.registerAccount)
  );

// Process the login attempt (temporary for testing)
router.post("/login", (req, res) => {
  res.status(200).send('login process');
});

module.exports = router;
