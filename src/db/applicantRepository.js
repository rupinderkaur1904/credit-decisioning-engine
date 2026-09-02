const pool = require('./pool');

async function insertApplicant({
  name,
  income,
  existingDebt,
  creditScore
}) {
  const [result] = await pool.query(
    `INSERT INTO applicants
      (name, income, existing_debt, credit_score)
     VALUES (?, ?, ?, ?)`,
    [name, income, existingDebt, creditScore]
  );

  return result.insertId;
}

async function findApplicantById(id) {
  const [rows] = await pool.query(
    `SELECT *
     FROM applicants
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  insertApplicant,
  findApplicantById
};
