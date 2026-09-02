const applicantService = require('../services/applicantService');

function validateApplicantInput(body) {
  const {
    name,
    income,
    existingDebt,
    creditScore
  } = body;

  const errors = [];

  if (
    !name ||
    typeof name !== 'string' ||
    !name.trim()
  ) {
    errors.push(
      'name is required and must be a non-empty string'
    );
  }

  if (
    typeof income !== 'number' ||
    Number.isNaN(income) ||
    income <= 0
  ) {
    errors.push(
      'income must be a positive number greater than zero'
    );
  }

  if (
    typeof existingDebt !== 'number' ||
    Number.isNaN(existingDebt) ||
    existingDebt < 0
  ) {
    errors.push(
      'existingDebt must be a non-negative number'
    );
  }

  if (
    !Number.isInteger(creditScore) ||
    creditScore < 300 ||
    creditScore > 900
  ) {
    errors.push(
      'creditScore must be an integer between 300 and 900'
    );
  }

  return errors;
}

async function createApplicant(req, res) {
  const errors = validateApplicantInput(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const applicant =
      await applicantService.createApplicant(req.body);

    return res.status(201).json(applicant);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'Failed to create applicant'
    });
  }
}

module.exports = {
  createApplicant
};
