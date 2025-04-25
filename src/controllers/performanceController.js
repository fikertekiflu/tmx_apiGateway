const { sendToQueue, consumeQueue } = require('../config/rabbitmq');
const { v4: uuidv4 } = require('uuid');

const pendingResponses = {};

async function handlePerformanceRequest(req, res, action, data) {
  const correlationId = uuidv4();
  const message = {
    action,
    data,
    correlationId,
  };

  pendingResponses[correlationId] = res;
  await sendToQueue('performance', message);
}

const getKpis = async (req, res) => {
  const { period, specificDate } = req.query;
  let startDate, endDate;
  const today = new Date();

  const getStartAndEndOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return {
      start: new Date(year, month, 1).toISOString().split('T')[0],
      end: new Date(year, month + 1, 0).toISOString().split('T')[0],
    };
  };

  const getStartAndEndOfWeek = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(date.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };
  switch (period) {
    case 'today':
      startDate = endDate = today.toISOString().split('T')[0];
      break;
    case 'this_week':
      ({ start: startDate, end: endDate } = getStartAndEndOfWeek(new Date()));
      break;
    case 'last_week':
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      ({ start: startDate, end: endDate } = getStartAndEndOfWeek(lastWeek));
      break;
    case 'this_month':
      ({ start: startDate, end: endDate } = getStartAndEndOfMonth(new Date()));
      break;
    case 'last_month':
      const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
      ({ start: startDate, end: endDate } = getStartAndEndOfMonth(lastMonth));
      break;
    case 'specific_month':
      if (!specificDate) return res.status(400).json({ error: 'Missing specificDate' });
      const [year, month] = specificDate.split('-');
      if (!year || !month) return res.status(400).json({ error: 'Invalid specificDate format' });
      ({ start: startDate, end: endDate } = getStartAndEndOfMonth(new Date(year, month - 1)));
      break;
    case 'specific_week':
      if (!specificDate) return res.status(400).json({ error: 'Missing specificDate' });
      ({ start: startDate, end: endDate } = getStartAndEndOfWeek(new Date(specificDate)));
      break;
    default:
      ({ start: startDate, end: endDate } = getStartAndEndOfMonth(today));
      break;
  }

  await handlePerformanceRequest(req, res, 'get-kpis', { startDate, endDate });
};
const getSalesData = async (req, res) => {
  const { startDate, endDate, purchaseType, agentUuid, batchNumber } = req.query;
  await handlePerformanceRequest(req, res, 'get-sales-data', { startDate, endDate, purchaseType, agentUuid, batchNumber });
};

consumeQueue('response-queue', (msg) => {
  if (msg) {
    const responseData = JSON.parse(msg.content.toString());
    const correlationId = responseData.correlationId;
    const res = pendingResponses[correlationId];

    if (res) {
      res.status(responseData.statusCode || 200).json(responseData.data);
      delete pendingResponses[correlationId];
    }
  }
});
module.exports = {
  getSalesData,
  getKpis,
};