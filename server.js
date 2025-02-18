/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const env = require("dotenv").config();
const path = require("path");
const app = express();
const static = require("./routes/static");
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const utilities = require("./utilities/index");
const session = require("express-session");
const pool = require('./database/');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const invCont = require('./controllers/invController');  // Correct import

/* ***********************
 * Middleware (Order Matters!)
 *************************/
app.use(bodyParser.json()); // Parses JSON data
app.use(bodyParser.urlencoded({ extended: true })); // Parses URL-encoded form data

app.use(cookieParser());
app.use(utilities.checkJWTToken); // Check JWT token middleware to verify if the user is logged in

// Express Session Middleware (Must come before flash)
app.use(
  session({
    store: new (require('connect-pg-simple')(session))({
      createTableIfMissing: true,
      pool,
    }),
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    name: 'sessionId',
  })
);

// Now add flash middleware AFTER session
app.use(flash());

/* Ensure flash messages persist across views */
app.use((req, res, next) => {
  res.locals.messages = req.session.flash || {}; // Store flash messages
  delete req.session.flash; // Clear flash messages after use
  next();
});

/* ***********************
 * Middleware to Provide Navigation to All Views
 *************************/
app.use(async (req, res, next) => {
  res.locals.nav = await utilities.getNav(req); // Pass req to getNav to handle logged-in state
  next();
});

app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // Store user session if exists
  next();
});

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/layout"); // Not at views root

/* ***********************
 * Serve Static Files (CSS, JS, Images)
 *************************/
app.use(express.static(path.join(__dirname, "public")));

/* ***********************
 * Index route
 *************************/
app.get("/", utilities.handleErrors(baseController.buildHome)); // Wrapped in higher-order function

/* ***********************
 * Routes
 *************************/
app.use(static);
app.use("/inv", inventoryRoute);

const errorRoute = require("./routes/errorRoute"); // Task 3 intentional error
app.use("/", errorRoute);

const accountRoute = require("./routes/accountRoute"); // Move account route handling here
app.use("/account", accountRoute);

// File Not Found Route - must be last route in list
app.use(async (req, res, next) => {
  next({
    status: 404, // HTTP status code for "Not Found"
    message: "Sorry, we appear to have lost that page.", // Custom error message
  });
});

// Correct route for getInventory
app.get('/inv/getInventory/:classification_id', invCont.getInventoryJSON);  // Ensure controller is imported properly

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav();
  console.error(`Error at: "${req.originalUrl}": ${err.message}`);
  res.render("errors/error", {
    title: err.status || "Server Error",
    message: err.message,
    nav,
  });
});

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT;
const host = process.env.HOST;

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`);
});
