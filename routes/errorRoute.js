// Task 3 intentional error
const express = require("express");
const router = express.Router();

// Intentional error trigger route
router.get("/trigger-error", (req, res, next) => {
    next(new Error("This is an intentional 500 error for testing!"));
});

module.exports = router;
