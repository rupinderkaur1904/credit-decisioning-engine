const decisionHistoryService = require('../services/decisionHistoryService');
const { NotFoundError } = require('../errors');

async function getDecisionHistory(req, res) {
  const applicantId = Number(req.params.id);
  if (!Number.isInteger(applicantId) || applicantId <= 0) {
    return res.status(400).json({ error: 'Applicant id must be a positive integer' });
  }

  try {
    const history = await decisionHistoryService.getDecisionHistory(applicantId);
    res.status(200).json({ applicantId, decisions: history });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve decision history' });
  }
}

module.exports = { getDecisionHistory };
