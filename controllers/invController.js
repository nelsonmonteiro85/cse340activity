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
invCont.buildManagementView = async function (req, res, next) {
  try {
    // Fetch classifications from the model
    const classifications = await invModel.getClassifications();

    // Create the classification select list using the utility function
    const classificationSelect = await utilities.buildClassificationList();

    // Get any flash messages to display
    let flashMessages = req.flash();

    // Render the management page with the required data
    res.render("inventory/management", {
      title: "Inventory Management", // Page title
      messages: flashMessages, // Pass flash messages to view
      classifications: classifications, // Pass the classifications data to the view
      classificationSelect: classificationSelect // Pass the select list to the view
    });
  } catch (error) {
    console.error("Error in buildManagementView:", error);
    next(error); // Pass the error to the next middleware
  }
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
    // Fetch classifications from the database
    const classificationList = await invModel.getClassifications();  // Fetch classification list as an array

    console.log("DEBUG: classificationList = ", classificationList);  // Debug to check the array data

    // Render the add-inventory view and pass the classification list as an array
    res.render("inventory/add-inventory", {
      title: "Add New Vehicle to Inventory",
      classificationList: classificationList,  // Pass the classification list as an array
      formData: req.body || {},  // Form data to keep inputs filled if needed
      nav: await utilities.getNav(),  // For navigation
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

/* ***************************
 *  Delete a classification by ID
 * ************************** */
invCont.removeClassification = async function (req, res) {
  const classificationId = req.params.id;
  console.log(`DEBUG: Attempting to delete classification with ID: ${classificationId}`);

  try {
    if (!classificationId) {
      req.flash("error", "Invalid classification ID.");
      return res.redirect("/inv/management");
    }

    const result = await invModel.deleteClassification(classificationId);

    if (result) {
      req.flash("success", `Classification "${result.classification_name}" removed successfully.`);
      console.log(`SUCCESS: Classification ${result.classification_name} deleted.`);
    } else {
      req.flash("error", "Classification not found or could not be removed.");
      console.log(`WARNING: Classification with ID ${classificationId} not found.`);
    }

  } catch (error) {
    console.error(`ERROR: Failed to delete classification with ID ${classificationId}:`, error);
    req.flash("error", "An unexpected error occurred while removing the classification.");
  }

  res.redirect("/inv/management");
};

/* ***************************
 *  Return Inventory by Classification As JSON
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  try {
    const classification_id = parseInt(req.params.classification_id);
    
    // Ensure classification_id is a valid number
    if (isNaN(classification_id)) {
      return res.status(400).json({ error: 'Invalid classification ID' });
    }

    const invData = await invModel.getInventoryByClassificationId(classification_id);

    if (invData && invData.length > 0) {
      return res.json(invData); // Return inventory data as JSON
    } else {
      return res.status(404).json({ error: 'No inventory found for this classification' });
    }
  } catch (error) {
    console.error('Error in getInventoryJSON:', error);
    return next(error); // Pass the error to the next error handler
  }
};

/* ***************************
 *  Build edit inventory view
 * ************************** */
invCont.editInventoryView = async function (req, res, next) {
  try {
    const inv_id = parseInt(req.params.invId); // Convert to integer
    let nav = await utilities.getNav();
    
    // Fetch inventory item data
    const itemData = await invModel.getInventoryById(inv_id);
    if (!itemData) {
      req.flash("error", "Vehicle not found.");
      return res.redirect("/inv/management");
    }

    // Build classification select list
    const classificationSelect = await utilities.buildClassificationList(itemData.classification_id);
    const itemName = `${itemData.inv_make} ${itemData.inv_model}`;

    res.render("inventory/edit-inventory", {
      title: "Edit " + itemName,
      nav,
      classificationSelect,
      errors: null,
      inv_id: itemData.inv_id,
      inv_make: itemData.inv_make,
      inv_model: itemData.inv_model,
      inv_year: itemData.inv_year,
      inv_description: itemData.inv_description,
      inv_image: itemData.inv_image,
      inv_thumbnail: itemData.inv_thumbnail,
      inv_price: itemData.inv_price,
      inv_miles: itemData.inv_miles,
      inv_color: itemData.inv_color,
      classification_id: itemData.classification_id
    });
  } catch (error) {
    console.error("Error in editInventoryView:", error);
    next(error);
  }
};

module.exports = invCont;