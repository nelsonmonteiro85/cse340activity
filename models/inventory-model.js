const pool = require("../database/");

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  try {
    const result = await pool.query("SELECT * FROM public.classification ORDER BY classification_name");
    console.log("DEBUG: classifications data =", result.rows); // Log the result rows
    return result.rows;
  } catch (error) {
    console.error("getClassifications error: " + error);
    throw error; // Propagate the error to be handled by the controller
  }
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    );
    return data.rows;
  } catch (error) {
    console.error("getInventoryByClassificationId error: " + error);
    throw error; // Propagate the error to be handled by the controller
  }
}

/* ***************************
 *  Get a specific inventory item by id
 * ************************** */
async function getInventoryById(inv_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory WHERE inv_id = $1`,
      [inv_id]
    );
    return data.rows;
  } catch (error) {
    console.error("getInventoryById error: " + error);
    throw error; // Propagate the error to be handled by the controller
  }
}

/* ***************************
 *  Add a new classification
 * ************************** */
async function addClassification(classification_name) {
  try {
    const sql = "INSERT INTO public.classification (classification_name) VALUES ($1) RETURNING *";
    const data = [classification_name];
    const result = await pool.query(sql, data);

    if (result.rows.length > 0) {
      return result.rows[0]; // Return the newly inserted classification data
    } else {
      console.error("No rows were inserted in addClassification");
      throw new Error("Failed to add classification.");
    }
  } catch (error) {
    console.error("addClassification error: " + error);
    throw error; // Propagate the error to be handled by the controller
  }
}

/* ***************************
 *  Delete a classification by ID
 * ************************** */
async function deleteClassification(classification_id) {
  try {
    // First, check if there are any inventory items related to this classification
    const inventoryCheck = await pool.query(
      "SELECT * FROM public.inventory WHERE classification_id = $1 LIMIT 1",
      [classification_id]
    );

    if (inventoryCheck.rows.length > 0) {
      // If there are inventory items, we may need to either delete them first or handle the constraint
      throw new Error('Cannot delete classification: There are inventory items associated with it.');
    }

    const result = await pool.query(
      "DELETE FROM public.classification WHERE classification_id = $1 RETURNING classification_name",
      [classification_id]
    );

    if (result.rowCount === 0) {
      throw new Error('Classification not found');
    }

    return result.rows[0]; // Return the name of the deleted classification
  } catch (error) {
    console.error("deleteClassification error: " + error);
    throw error; // Propagate the error to be handled by the controller
  }
}

module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getInventoryById,
  addClassification,
  deleteClassification,
};
