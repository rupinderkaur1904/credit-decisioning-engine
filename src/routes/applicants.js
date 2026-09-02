const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicantController');
const decisionHistoryController = require('../controllers/decisionHistoryController');

router.post('/', applicantController.createApplicant);
router.get('/:id/decisions', decisionHistoryController.getDecisionHistory);

module.exports = router;
