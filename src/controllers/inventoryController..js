// api_gateway/controller/inventoryController.js
const { sendToQueue } = require('../config/rabbitmq');
const { v4: uuidv4 } = require('uuid');

const pendingResponses = {};

async function handleInventoryRequest(req, res, action, data) {
    const correlationId = uuidv4();
    const message = {
        action,
        data,
        correlationId,
    };

    pendingResponses[correlationId] = res;
    await sendToQueue('inventory', message);
}

const getStockLevels = async (req, res) => {
    await handleInventoryRequest(req, res, 'get-stock-levels', {}); // No specific data needed for now
};

module.exports = {
    getStockLevels,
};