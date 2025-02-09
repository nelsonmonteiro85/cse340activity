const invModel = require("../models/inventory-model");
const utilities = require("../utilities/");

const invCont = {};

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId;
  const data = await invModel.getInventoryByClassificationId(classification_id);
  const grid = await utilities.buildClassificationGrid(data);
  let nav = await utilities.getNav(); // Get the navigation HTML

  if (data.length > 0) {
    const className = data[0].classification_name;
    res.render("./inventory/classification", {
      title: className + " vehicles",
      nav,
      grid,
    });
  } else {
    res.redirect("/inv");
  }
};

/* ***************************
 *  Build inventory item detail view
 * ************************** */
invCont.buildByInvId = async function (req, res, next) {
  const inv_id = req.params.invId;
  const data = await invModel.getInventoryById(inv_id);

  const vehicle = data[0]; // Get the vehicle object
  const detailView = await utilities.buildDetailView(vehicle);

  let nav = await utilities.getNav(); // Get the navigation HTML

  if (data.length > 0) {
    res.render("inventory/detail", {
      title: `${vehicle.inv_make} ${vehicle.inv_model}`,
      detailView,
      vehicle,
      nav,
    });
  } else {
    res.redirect("/inv");
  }
};

/* ***************************
 *  Build inventory management view
 * ************************** */
invCont.buildManagementView = function (req, res, next) {
  // Get flash messages from the session
  let flashMessages = req.flash();

  // Render the management page with the flash messages
  res.render("inventory/management", {
    title: "Inventory Management", // Page title
    messages: flashMessages // Pass flash messages to view
  });
};

/* ***************************
 *  Add classification (POST route)
 * ************************** */
invCont.addClassification = async function (req, res, next) {
  const { classification_name } = req.body; // Keeping things straight

  // Server-side validation
  if (!classification_name || !classification_name.match(/^[a-zA-Z0-9]+$/)) {
      req.flash('error', 'Classification name is required and must not contain spaces or special characters.');
      return res.redirect('/inv/add-classification'); // Redirect back to form on error
  }

  try {
      await invModel.addClassification(classification_name);
      req.flash('success', 'Classification added successfully!');

      // Refresh Navigation (Important!)
      const nav = await utilities.getNav(); // Rebuild navigation
      res.locals.nav = nav; // Update res.locals to make the new nav available

      res.redirect('/inv/management'); // Redirect to management view
  } catch (error) {
      console.error(error);
      req.flash('error', 'Error adding classification.');
      res.redirect('/inv/add-classification'); // Redirect back to form on error
  }
};

/* ***************************
 *  Build Add Inventory View
 * ************************** */
invCont.buildAddInventoryView = async function (req, res, next) {
  try {
    // Retrieve classification list from the database or model
    const classificationList = await utilities.buildClassificationList(); 

    console.log("DEBUG: classificationList =", classificationList); // Log to see if classifications are fetched correctly

    const nav = await utilities.getNav();
    res.render("inventory/add-inventory", {
      title: "Add New Vehicle to Inventory",
      classificationList, // Ensure classificationList is being passed here
      formData: req.body || {},
      nav
    });
  } catch (error) {
    console.error("Error in buildAddInventoryView:", error);
    next(error);
  }
};

/* ***************************
 *  Handle Add Inventory Form Submission
 * ************************** */
invCont.addInventory = async function (req, res, next) {
  const { inv_make, inv_model, inv_year, inv_price, classification_id } = req.body; // Keeping things straight

  // Server-side Validation
  if (!inv_make || !inv_model || !inv_year || !inv_price || !classification_id || isNaN(inv_year) || isNaN(inv_price) || inv_price < 0) {
      req.flash('error', 'All fields are required and must be valid.');
      return res.redirect('/inv/add-inventory');
  }

  try {
      // Handle image upload with multer here

      const newInventory = { inv_make, inv_model, inv_year, inv_price, classification_id, /* ... other data */ };
      await invModel.addInventory(newInventory);
      req.flash('success', 'Vehicle added successfully!');
      res.redirect('/inv/management'); // Redirect after successful insert
  } catch (error) {
      console.error("Error adding inventory:", error);
      req.flash('error', 'Error adding vehicle. Please check your inputs.');
      res.redirect('/inv/add-inventory'); // Redirect back to form on error
  }
};

module.exports = invCont;