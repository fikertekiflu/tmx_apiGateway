// api_gateway/routes/index.js (or inventoryRoutes.js)
const express = require('express');
const inventoryController = require('../controllers/inventoryController.'); // Import the new controller

const router = express.Router();
router.get('/stock', inventoryController.getStockLevels);

module.exports = router;