const applicantRepository = require('../db/applicantRepository');

async function createApplicant({
  name,
  income,
  existingDebt,
  creditScore
}) {
  const id = await applicantRepository.insertApplicant({
    name,
    income,
    existingDebt,
    creditScore
  });

  return {
    id,
    name,
    income,
    existingDebt,
    creditScore
  };
}

async function getApplicant(id) {
  return applicantRepository.findApplicantById(id);
}

module.exports = {
  createApplicant,
  getApplicant
};
