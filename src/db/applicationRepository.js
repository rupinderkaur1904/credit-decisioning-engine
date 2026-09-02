const pool = require('./pool');

async function insertApplication(connection, { applicantId, loanAmount, tenureMonths }) {
  const [result] = await connection.query(
    `INSERT INTO applications (applicant_id, loan_amount, tenure_months)
     VALUES (?, ?, ?)`,
    [applicantId, loanAmount, tenureMonths]
  );
  return result.insertId;
}

async function findApplicationById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM applications WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { insertApplication, findApplicationById };
