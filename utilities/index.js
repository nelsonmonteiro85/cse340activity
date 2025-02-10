const invModel = require("../models/inventory-model")
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function () {
  try {
    let data = await invModel.getClassifications(); // Retrieve classification data
    let list = "<ul>";

    // Home link
    list += '<li><a href="/" title="Home page">Home</a></li>';

    // "New Car" link
    list += '<li><a href="/inv/management" title="Manage Inventory">New Car</a></li>';

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
    let data = await invModel.getClassifications(); // Ensure this returns classifications
    console.log("DEBUG: data =", data); // Check the data being returned
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

module.exports = Util;