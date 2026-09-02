// Named constants for policy thresholds
const RISK_LOW_THRESHOLD = 40;
const RISK_HIGH_THRESHOLD = 0;
const APPROVAL_THRESHOLD = 20;

// DTI bands (decimal form)
const DTI_BAND_LOW = 0.20;
const DTI_BAND_MED = 0.35;
const DTI_BAND_HIGH = 0.50;
const DTI_BAND_VHIGH = 0.70;

// Credit score bands
const CREDIT_BAND_HIGH = 750;
const CREDIT_BAND_LOW = 650;

// LTI bands
const LTI_BAND_LOW = 1;
const LTI_BAND_MED = 2;
const LTI_BAND_HIGH = 3;
const LTI_BAND_VHIGH = 5;

function evaluateApplication({
  income,
  existingDebt,
  creditScore,
  loanAmount,
  tenureMonths
}) {
  // --- Input validation ---
  if (
    typeof income !== 'number' ||
    Number.isNaN(income) ||
    income <= 0
  ) {
    throw new Error(
      'income must be a positive number greater than zero'
    );
  }

  if (
    typeof existingDebt !== 'number' ||
    Number.isNaN(existingDebt) ||
    existingDebt < 0
  ) {
    throw new Error(
      'existingDebt must be a non-negative number'
    );
  }

  if (
    !Number.isInteger(creditScore) ||
    creditScore < 300 ||
    creditScore > 900
  ) {
    throw new Error(
      'creditScore must be an integer between 300 and 900'
    );
  }

  if (
    typeof loanAmount !== 'number' ||
    Number.isNaN(loanAmount) ||
    loanAmount <= 0
  ) {
    throw new Error(
      'loanAmount must be a positive number greater than zero'
    );
  }

  if (
    !Number.isInteger(tenureMonths) ||
    tenureMonths <= 0
  ) {
    throw new Error(
      'tenureMonths must be a positive integer'
    );
  }

  // --- Rule 1: DTI ---
  const dti = existingDebt / income;
  let dtiContribution;
  let dtiDetail;

  if (dti <= DTI_BAND_LOW) {
    dtiContribution = 30;
    dtiDetail = `DTI is ${(dti * 100).toFixed(1)}% (debt ${existingDebt} / income ${income})`;
  } else if (dti <= DTI_BAND_MED) {
    dtiContribution = 15;
    dtiDetail = `DTI is ${(dti * 100).toFixed(1)}% (debt ${existingDebt} / income ${income})`;
  } else if (dti <= DTI_BAND_HIGH) {
    dtiContribution = 0;
    dtiDetail = `DTI is ${(dti * 100).toFixed(1)}% (debt ${existingDebt} / income ${income})`;
  } else if (dti <= DTI_BAND_VHIGH) {
    dtiContribution = -15;
    dtiDetail = `DTI is ${(dti * 100).toFixed(1)}% (debt ${existingDebt} / income ${income})`;
  } else {
    dtiContribution = -30;
    dtiDetail = `DTI is ${(dti * 100).toFixed(1)}% (debt ${existingDebt} / income ${income})`;
  }

  // --- Rule 2: Credit Score ---
  let creditContribution;
  let creditDetail;

  if (creditScore >= CREDIT_BAND_HIGH) {
    creditContribution = 30;
    creditDetail = `Credit score is ${creditScore} (excellent band)`;
  } else if (creditScore >= CREDIT_BAND_LOW) {
    creditContribution = 0;
    creditDetail = `Credit score is ${creditScore} (fair band)`;
  } else {
    creditContribution = -30;
    creditDetail = `Credit score is ${creditScore} (poor band)`;
  }

  // --- Rule 3: LTI ---
  const lti = loanAmount / income;
  let ltiContribution;
  let ltiDetail;

  if (lti <= LTI_BAND_LOW) {
    ltiContribution = 30;
    ltiDetail = `LTI is ${lti.toFixed(2)}x (loan ${loanAmount} / income ${income})`;
  } else if (lti <= LTI_BAND_MED) {
    ltiContribution = 15;
    ltiDetail = `LTI is ${lti.toFixed(2)}x (loan ${loanAmount} / income ${income})`;
  } else if (lti <= LTI_BAND_HIGH) {
    ltiContribution = 0;
    ltiDetail = `LTI is ${lti.toFixed(2)}x (loan ${loanAmount} / income ${income})`;
  } else if (lti <= LTI_BAND_VHIGH) {
    ltiContribution = -15;
    ltiDetail = `LTI is ${lti.toFixed(2)}x (loan ${loanAmount} / income ${income})`;
  } else {
    ltiContribution = -30;
    ltiDetail = `LTI is ${lti.toFixed(2)}x (loan ${loanAmount} / income ${income})`;
  }

  // --- Total Score ---
  const score = dtiContribution + creditContribution + ltiContribution;

  // --- Risk Tier ---
  let riskTier;
  if (score >= RISK_LOW_THRESHOLD) {
    riskTier = 'LOW';
  } else if (score >= RISK_HIGH_THRESHOLD) {
    riskTier = 'MEDIUM';
  } else {
    riskTier = 'HIGH';
  }

  // --- Outcome ---
  let outcome;
  if (score >= APPROVAL_THRESHOLD) {
    outcome = 'APPROVED';
  } else {
    outcome = 'REJECTED';
  }

  // --- Factor Breakdown ---
  const factors = [
    {
      factorName: 'debt_to_income_ratio',
      contribution: dtiContribution,
      detail: dtiDetail
    },
    {
      factorName: 'credit_score',
      contribution: creditContribution,
      detail: creditDetail
    },
    {
      factorName: 'loan_to_income_ratio',
      contribution: ltiContribution,
      detail: ltiDetail
    }
  ];

  return {
    score,
    riskTier,
    outcome,
    factors
  };
}

module.exports = { evaluateApplication };
