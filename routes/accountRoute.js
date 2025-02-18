const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities/index");
const validate = require("../utilities/account-validation");

// Routes for login/registration
router.get("/login", utilities.handleErrors(accountController.buildLogin));
router.get("/register", utilities.handleErrors(accountController.buildRegister));
router.post(
    "/register",
    validate.registrationRules(),
    validate.checkRegistrationData,
    utilities.handleErrors(accountController.registerAccount) 
);
router.post(
    "/login",
    validate.loginRules(),
    validate.checkLoginData,
    utilities.handleErrors(accountController.accountLogin)
);

// Logout route
router.get('/logout', utilities.handleErrors(accountController.logout));

// Account Management and Update Routes
router.get("/", 
    utilities.checkJWTToken, 
    utilities.checkLogin, 
    utilities.handleErrors(accountController.buildAccountManagement)
);

router.get("/edit/:id", 
    utilities.checkJWTToken, 
    utilities.checkLogin, 
    utilities.handleErrors(accountController.buildAccountUpdate)
);

router.post(
    "/update",
    utilities.checkJWTToken,
    utilities.checkLogin,
    validate.updateRules(), // Use validate.updateRules()
    validate.checkUpdateData, // Use validate.checkUpdateData()
    utilities.handleErrors(accountController.processAccountUpdate)
);

router.post(
    "/change-password",
    utilities.checkJWTToken,
    utilities.checkLogin,
    validate.passwordRules(), // Use validate.passwordRules()
    validate.checkPasswordData, // Use validate.checkPasswordData()
    utilities.handleErrors(accountController.processPasswordChange)
);

// Additional routes protected by employee role check (if needed)
router.get("/employee-dashboard", 
    utilities.checkJWTToken, 
    utilities.checkLogin, 
    utilities.checkEmployee,  // Check if the user is an employee
    utilities.handleErrors(accountController.buildEmployeeDashboard)
);

module.exports = router;
