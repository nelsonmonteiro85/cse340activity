const invModel = require("../models/inventory-model")
const utilities = require("../utilities/")

const invCont = {}

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async function (req, res, next) {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  let nav = await utilities.getNav()

  if (data.length > 0) {
    const className = data[0].classification_name
    res.render("./inventory/classification", {
      title: className + " vehicles",
      nav,
      grid,
    })
  } else {
    res.redirect("/inv")
  }
}

/* ***************************
 *  Build inventory item detail view
 * ************************** */
invCont.buildByInvId = async function (req, res, next) {
  const inv_id = req.params.invId;
  const data = await invModel.getInventoryById(inv_id);

  const vehicle = data[0]; // Get the vehicle object
  const detailView = await utilities.buildDetailView(vehicle);

  let nav = await utilities.getNav();

  if (data.length > 0) {
    res.render("inventory/detail", {
      title: `${vehicle.inv_make} ${vehicle.inv_model}`,
      detailView,
      vehicle,
      nav
    });
  } else {
    res.redirect("/inv");
  }
};

module.exports = invCont