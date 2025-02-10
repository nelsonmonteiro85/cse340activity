const express = require("express");
const router = new express.Router();
const invController = require("../controllers/invController");

// Route to build inventory by classification view
router.get("/type/:classificationId", invController.buildByClassificationId);

// Route to build inventory item detail view
router.get("/detail/:invId", invController.buildByInvId);

// Route to build inventory management view (for Task 1)
router.get("/management", invController.buildManagementView);

// Route to display the add classification form (Task 2)
router.get("/add-classification", (req, res) => {
    res.render("inventory/add-classification", { 
        title: "Add New Classification", // Pass the title here
        messages: req.flash() 
    });
});

// Route to handle the form submission for adding a classification (Task 2)
router.post("/add-classification", invController.addClassification);

// Route to display the "Add New Car" form
router.get("/add-inventory", invController.buildAddInventoryView);

// Route to handle the form submission for adding a vehicle
router.post("/add-inventory", invController.addInventory);

module.exports = router;
