const applicationRepository = require('../db/applicationRepository');
const applicantRepository = require('../db/applicantRepository');
const decisionRepository = require('../db/decisionRepository');
const { evaluateApplication: runScorecard } = require('../rules/scorecard');
const { withTransaction } = require('../db/withTransaction');
const { NotFoundError, ValidationError } = require('../errors');

async function createApplication({ applicantId, loanAmount, tenureMonths }) {
  const applicant = await applicantRepository.findApplicantById(applicantId);
  if (!applicant) {
    throw new NotFoundError(`Applicant with id ${applicantId} does not exist`);
  }

  const id = await withTransaction((connection) =>
    applicationRepository.insertApplication(connection, { applicantId, loanAmount, tenureMonths })
  );

  return { id, applicantId, loanAmount, tenureMonths };
}

async function evaluateApplication(applicationId) {
  const application = await applicationRepository.findApplicationById(applicationId);
  if (!application) {
    throw new NotFoundError(`Application with id ${applicationId} does not exist`);
  }

  const applicant = await applicantRepository.findApplicantById(application.applicant_id);
  if (!applicant) {
    throw new NotFoundError(`Applicant for application ${applicationId} does not exist`);
  }

  // mysql2 returns DECIMAL columns as strings, not numbers — must convert explicitly
  const scorecardInput = {
    income: Number(applicant.income),
    existingDebt: Number(applicant.existing_debt),
    creditScore: applicant.credit_score,
    loanAmount: Number(application.loan_amount),
    tenureMonths: application.tenure_months
  };

  let result;
  try {
    result = runScorecard(scorecardInput);
  } catch (err) {
    throw new ValidationError(err.message);
  }

  const decisionId = await withTransaction(async (connection) => {
    const decisionId = await decisionRepository.insertDecision(connection, {
      applicationId,
      score: result.score,
      riskTier: result.riskTier,
      outcome: result.outcome
    });

    for (const factor of result.factors) {
      await decisionRepository.insertDecisionFactor(connection, {
        decisionId,
        factorName: factor.factorName,
        contribution: factor.contribution,
        detail: factor.detail
      });
    }

    return decisionId;
  });

  return {
    applicationId,
    decisionId,
    score: result.score,
    riskTier: result.riskTier,
    outcome: result.outcome,
    factors: result.factors
  };
}

function simulateApplication({ income, existingDebt, creditScore, loanAmount, tenureMonths }) {
  // Pure, no-persistence pass-through to the rule engine — lets the frontend
  // run "what-if" scenarios instantly without creating applicant/application records.
  return runScorecard({ income, existingDebt, creditScore, loanAmount, tenureMonths });
}

module.exports = { createApplication, evaluateApplication, simulateApplication };
