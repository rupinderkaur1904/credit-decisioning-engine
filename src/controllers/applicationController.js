const applicationService = require('../services/applicationService');
const { NotFoundError, ValidationError } = require('../errors');

function validateCreateApplicationInput(body) {
  const { applicantId, loanAmount, tenureMonths } = body;
  const errors = [];

  if (!Number.isInteger(applicantId) || applicantId <= 0) {
    errors.push('applicantId must be a positive integer');
  }
  if (typeof loanAmount !== 'number' || isNaN(loanAmount) || loanAmount <= 0) {
    errors.push('loanAmount must be a positive number greater than zero');
  }
  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) {
    errors.push('tenureMonths must be a positive integer');
  }

  return errors;
}

async function createApplication(req, res) {
  const errors = validateCreateApplicationInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const application = await applicationService.createApplication(req.body);
    res.status(201).json(application);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create application' });
  }
}

async function evaluateApplication(req, res) {
  const applicationId = Number(req.params.id);
  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({ error: 'Application id must be a positive integer' });
  }

  try {
    const result = await applicationService.evaluateApplication(applicationId);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof ValidationError) {
      return res.status(422).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to evaluate application' });
  }
}

function validateSimulateInput(body) {
  const { income, existingDebt, creditScore, loanAmount, tenureMonths } = body;
  const errors = [];

  if (typeof income !== 'number' || isNaN(income) || income <= 0) {
    errors.push('income must be a positive number greater than zero');
  }
  if (typeof existingDebt !== 'number' || isNaN(existingDebt) || existingDebt < 0) {
    errors.push('existingDebt must be a non-negative number');
  }
  if (!Number.isInteger(creditScore) || creditScore < 300 || creditScore > 900) {
    errors.push('creditScore must be an integer between 300 and 900');
  }
  if (typeof loanAmount !== 'number' || isNaN(loanAmount) || loanAmount <= 0) {
    errors.push('loanAmount must be a positive number greater than zero');
  }
  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) {
    errors.push('tenureMonths must be a positive integer');
  }

  return errors;
}

function simulateApplication(req, res) {
  const errors = validateSimulateInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const result = applicationService.simulateApplication(req.body);
    res.status(200).json(result);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
}

module.exports = { createApplication, evaluateApplication, simulateApplication };
