const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');

router.post('/', applicationController.createApplication);
router.post('/:id/evaluate', applicationController.evaluateApplication);
router.post('/simulate', applicationController.simulateApplication);

module.exports = router;
