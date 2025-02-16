const pool = require("../database/");

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  const result = await pool.query("SELECT * FROM public.classification ORDER BY classification_name");
  console.log("DEBUG: classifications data =", result.rows); // Log the result rows
  return result.rows;
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

      if (result.rows.length > 0) {  // Check if any rows were inserted
          return result.rows[0]; // Return the newly inserted classification data
      } else {
          console.error("No rows were inserted in addClassification");
          return null; // Or throw an error if you prefer
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
    const result = await pool.query(
      "DELETE FROM public.classification WHERE classification_id = $1 RETURNING classification_name",
      [classification_id]
    );

    // If no rows were affected, it means the classification doesn't exist
    if (result.rowCount === 0) {
      throw new Error('Classification not found');
    }

    // Return the name of the deleted classification
    return result.rows[0];
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
