const invModel = require("../models/inventory-model");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const pool = require('../database');

const Util = {};

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function () {
  try {
    let data = await invModel.getClassifications();
    let list = "<ul>";

    // Home link
    list += '<li><a href="/" title="Home page">Home</a></li>';

    // "New Car" link
    list += '<li><a href="/inv/management" title="Manage Inventory">Management</a></li>';

    // "Feedback" link
    list += '<li><a href="/feedback" title="Give Feedback">Feedback</a></li>';

    // Dynamically add classifications
    data.forEach((row) => {
      list += "<li>";
      list +=
        '<a href="/inv/type/' +
        row.classification_id +
        '" title="See our inventory of ' +
        row.classification_name +
        ' vehicles">' +
        row.classification_name +
        "</a>";
      list += "</li>";
    });

    list += "</ul>";
    return list;
  } catch (err) {
    console.error("Error in getNav:", err);
    return "<ul><li><a href='/'>Home</a></li></ul>"; // Fallback navigation if an error occurs
  }
};

/* **************************************
 * Build the classification view HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
  if (!data.length) {
    return '<p class="notice">Sorry, no matching vehicles could be found.</p>';
  }

  let grid = '<ul id="inv-display">';
  data.forEach((vehicle) => {
    grid += `
      <li>
        <a href="/inv/detail/${vehicle.inv_id}" 
           title="View ${vehicle.inv_make} ${vehicle.inv_model} details">
          <img src="${vehicle.inv_thumbnail}" 
               alt="Image of ${vehicle.inv_make} ${vehicle.inv_model} on CSE Motors">
        </a>
        <div class="namePrice">
          <hr />
          <h2>
            <a href="/inv/detail/${vehicle.inv_id}" 
               title="View ${vehicle.inv_make} ${vehicle.inv_model} details">
              ${vehicle.inv_make} ${vehicle.inv_model}
            </a>
          </h2>
          <span>$${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</span>
        </div>
      </li>`;
  });
  grid += "</ul>";

  return grid;
};

/* **************************************
 * Build the vehicle detail view HTML
 * ************************************ */
Util.buildDetailView = async function (vehicle) {
  return `
    <div class="vehicle-detail">
      <img src="${vehicle.inv_image}" 
           alt="Image of ${vehicle.inv_make} ${vehicle.inv_model}">
      <div class="vehicle-info">
        <h2>${vehicle.inv_make} ${vehicle.inv_model}</h2>
        <p><strong>Year:</strong> ${vehicle.inv_year}</p>
        <p><strong>Price:</strong> $${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</p>
        <p><strong>Mileage:</strong> ${vehicle.inv_miles ? new Intl.NumberFormat("en-US").format(vehicle.inv_miles) + " miles" : "N/A"}</p>
        <p><strong>Description:</strong> ${vehicle.inv_description}</p>
      </div>
    </div>`;
};

/* ****************************************
 * Build the classification drop-down list
 **************************************** */
Util.buildClassificationList = async function (classification_id = null) {
  try {
    let data = await invModel.getClassifications();
    let classificationList = `
      <select name="classification_id" id="classificationList" required>
        <option value="">Choose a Classification</option>`;

    data.forEach((row) => {
      classificationList += `
        <option value="${row.classification_id}" ${classification_id == row.classification_id ? "selected" : ""}>
          ${row.classification_name}
        </option>`;
    });

    classificationList += "</select>";
    return classificationList;
  } catch (err) {
    console.error("Error in buildClassificationList:", err);
    return `<select name="classification_id" id="classificationList" required>
      <option value="">Choose a Classification</option>
    </select>`;
  }
};

/* ****************************************
 * Middleware for Handling Errors
 * Wrap other functions in this for general error handling
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* ****************************************
 * Middleware to check token validity
 **************************************** */
// In utilities/index.js
Util.checkJWTToken = (req, res, next) => {
  const token = req.cookies.jwt;
  
  if (!token) {
    res.locals.loggedin = 0;
    return next();
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, accountData) {
    if (err) {
      req.flash("error", "Please log in");
      res.clearCookie("jwt");  // Clear the cookie if the token is invalid
      res.locals.loggedin = 0;
      return res.redirect("/account/login");
    }

    res.locals.accountData = accountData;  // Store the decoded user info here
    res.locals.loggedin = 1;
    next();
  });
};

/* ****************************************
 * Check Login Middleware
 **************************************** */
Util.checkLogin = async (req, res, next) => {
  if (req.cookies.jwt) {
      try {
          const decodedToken = jwt.verify(req.cookies.jwt, process.env.ACCESS_TOKEN_SECRET);
          const userResult = await pool.query('SELECT * FROM account WHERE account_id = $1', [decodedToken.account_id]);
          const user = userResult.rows[0];

          if (user) {
              res.locals.loggedin = true; // Set loggedin to true
              res.locals.user = user; // Pass the user object
              next();
          } else {
              res.clearCookie('jwt');
              res.redirect('/account/login');
          }

      } catch (error) {
          console.error("JWT verification error:", error);
          res.clearCookie('jwt');
          res.redirect('/account/login');
      }
  } else {
      res.locals.loggedin = false; // Set loggedin to false
      next();
  }
}

/* ****************************************
 * Middleware for JWT login state (check if user is logged in)
 **************************************** */
Util.checkAccount = (req, res, next) => {
  if (res.locals.loggedin) {
    res.locals.accountName = res.locals.accountData.username;  // Optionally handle user-specific actions
  }
  next();
};

/* ****************************************
 * Check Employee
 **************************************** */
Util.checkEmployee = (req, res, next) => {
  if (res.locals.loggedin && (res.locals.accountData.account_type === 'Employee' || res.locals.accountData.account_type === 'Admin')) {
    return next();  // Proceed to the next route or middleware
  }
  req.flash("error", "You are not authorized to access this page.");
  res.redirect("/account");  // Or wherever you want to redirect unauthorized users
};

module.exports = Util;
