/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const env = require("dotenv").config()
const path = require('path');
const app = express()
const static = require("./routes/static")
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute")
const utilities = require("./utilities/index") // Added utilities import

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set("layout", "./layouts/layout") // not at views root

/* ***********************
 * Serve Static Files (CSS, JS, Images)
 *************************/
app.use(express.static(path.join(__dirname, 'public')));

/* ***********************
* Index route
*************************/
app.get("/", utilities.handleErrors(baseController.buildHome)) // Wrapped in higher-order function

/* ***********************
 * Routes
 *************************/
app.use(static)
// Inventory routes
app.use("/inv", inventoryRoute)

const errorRoute = require("./routes/errorRoute"); // Task 3 intentional error
app.use("/", errorRoute);

// File Not Found Route - must be last route in list
app.use(async (req, res, next) => {
  next({
    status: 404, // HTTP status code for "Not Found"
    message: "Sorry, we appear to have lost that page." // Custom error message
  })
})

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav()
  console.error(`Error at: "${req.originalUrl}": ${err.message}`)
  res.render("errors/error", {
    title: err.status || "Server Error",
    message: err.message,
    nav
  })
})

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT
const host = process.env.HOST

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})
