const pool = require('./pool');

async function insertDecision(connection, { applicationId, score, riskTier, outcome }) {
  const [result] = await connection.query(
    `INSERT INTO decisions (application_id, score, risk_tier, outcome)
     VALUES (?, ?, ?, ?)`,
    [applicationId, score, riskTier, outcome]
  );
  return result.insertId;
}

async function insertDecisionFactor(connection, { decisionId, factorName, contribution, detail }) {
  await connection.query(
    `INSERT INTO decision_factors (decision_id, factor_name, contribution, detail)
     VALUES (?, ?, ?, ?)`,
    [decisionId, factorName, contribution, detail]
  );
}

async function findDecisionHistoryByApplicantId(applicantId) {
  const [rows] = await pool.query(
    `SELECT
       a.id            AS application_id,
       a.loan_amount,
       a.tenure_months,
       d.id            AS decision_id,
       d.score,
       d.risk_tier,
       d.outcome,
       d.created_at    AS decided_at,
       f.factor_name,
       f.contribution,
       f.detail
     FROM applications a
     JOIN decisions d        ON d.application_id = a.id
     JOIN decision_factors f ON f.decision_id = d.id
     WHERE a.applicant_id = ?
     ORDER BY d.created_at DESC, d.id DESC, f.id ASC`,
    [applicantId]
  );
  return rows;
}

module.exports = {
  insertDecision,
  insertDecisionFactor,
  findDecisionHistoryByApplicantId
};
