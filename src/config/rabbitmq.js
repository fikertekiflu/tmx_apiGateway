const amqp = require('amqplib');
const logger = require('./logger');
let connection;
async function connectRabbitMQ() {
  try {
    connection = await amqp.connect('amqp://localhost');
    logger.info('API Gateway connected to RabbitMQ');
  } catch (error) {
    logger.error('API Gateway failed to connect to RabbitMQ:', error);
    throw error;
  }
}
async function sendToQueue(queue, message) {
  if (!connection) {
    await connectRabbitMQ();
  }
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true }); 
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  logger.info(`API Gateway sent to ${queue}: ${JSON.stringify(message)}`);
}
async function consumeQueue(queue, callback) {
  if (!connection) {
    await connectRabbitMQ();
  }
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true }); // Make sure durable is the same in all services.
  channel.consume(queue, callback);
}
module.exports = { sendToQueue, consumeQueue };