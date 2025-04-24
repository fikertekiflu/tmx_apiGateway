const express = require('express');
const performanceController = require('../controllers/performanceController');

const router = express.Router();

router.get('/kpis', performanceController.getKpis);
router.get('/sales-data', performanceController.getSalesData);

module.exports = router;