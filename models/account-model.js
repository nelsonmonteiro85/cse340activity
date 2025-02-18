const pool = require('../database/index');

/* *****************************
 *   Register new account
 * *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
  try {
    const sql = `INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) 
                 VALUES ($1, $2, $3, $4, 'Client') RETURNING *`;
    const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_password]);
    return result.rows[0];
  } catch (error) {
    console.error("Error registering account:", error);
    throw new Error("Registration failed. Please try again.");
  }
}

/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email) {
  try {
    const sql = "SELECT 1 FROM account WHERE account_email = $1";
    const result = await pool.query(sql, [account_email]);
    return result.rowCount > 0; // Returns true if email exists
  } catch (error) {
    console.error("Error checking email:", error);
    throw new Error("Email check failed.");
  }
}

/* *****************************
 *  Return account data using email address
 * ***************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = `SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password 
                 FROM account WHERE account_email = $1`;
    const result = await pool.query(sql, [account_email]);
    if (result.rowCount === 0) {
      throw new Error("No matching email found");
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error fetching account by email:", error);
    throw new Error("Account retrieval failed.");
  }
}

module.exports = { registerAccount, checkExistingEmail, getAccountByEmail };
