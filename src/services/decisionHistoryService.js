const applicantRepository = require('../db/applicantRepository');
const decisionRepository = require('../db/decisionRepository');
const { NotFoundError } = require('../errors');

function groupRowsByDecision(rows) {
  const decisionsMap = new Map();

  for (const row of rows) {
    if (!decisionsMap.has(row.decision_id)) {
      decisionsMap.set(row.decision_id, {
        applicationId: row.application_id,
        loanAmount: Number(row.loan_amount),
        tenureMonths: row.tenure_months,
        decisionId: row.decision_id,
        score: row.score,
        riskTier: row.risk_tier,
        outcome: row.outcome,
        decidedAt: row.decided_at,
        factors: []
      });
    }

    decisionsMap.get(row.decision_id).factors.push({
      factorName: row.factor_name,
      contribution: row.contribution,
      detail: row.detail
    });
  }

  return Array.from(decisionsMap.values());
}

async function getDecisionHistory(applicantId) {
  const applicant = await applicantRepository.findApplicantById(applicantId);
  if (!applicant) {
    throw new NotFoundError(`Applicant with id ${applicantId} does not exist`);
  }

  const rows = await decisionRepository.findDecisionHistoryByApplicantId(applicantId);
  return groupRowsByDecision(rows);
}

module.exports = { getDecisionHistory };
