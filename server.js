const express = require('express');
const performanceRoutes = require('./src/routes/performanceRoute'); // Assuming you create this file
const { consumeQueue } = require('./src/config/rabbitmq');
const logger = require('./src/config/logger');

const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tmx/performance', performanceRoutes);

 // You might not need this in API Gateway if performance service handles DB

consumeQueue('response-queue', (msg) => {
  if (msg) {
    logger.info(`Response received for performance: ${msg.content.toString()}`);
    // You might want to handle specific responses related to performance here
    // For example, checking correlation IDs and forwarding to original requests
  }
});

app.listen(process.env.PORT, () => {
  logger.info(`API Gateway listening on port ${process.env.PORT} for performance.`);
});