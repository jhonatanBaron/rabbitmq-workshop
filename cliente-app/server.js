const express = require('express');
const amqp = require('amqplib');

const app = express();
const PORT = 3000;
const CLIENT_ID = process.env.CLIENT_ID || 'unknown-client';
const RABBITMQ_URL = 'amqp://user:password@rabbitmq:5672';
const EXCHANGE_NAME = 'events_exchange';
const ROUTING_KEY = 'event.analytics';

let channel = null;

// Function to connect to RabbitMQ and setup channel
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    console.log(`Connected to RabbitMQ and channel created. Exchange ${EXCHANGE_NAME} asserted.`);
    // Send initial message after connection
    publishEvent(); 
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error.message);
    // Retry connection after a delay
    setTimeout(connectRabbitMQ, 5000);
  }
}

// Function to publish an event to the exchange
const publishEvent = () => {
  if (!channel) {
    console.log('Channel not available, skipping publish.');
    return;
  }
  const event = {
    eventType: 'clientAccess',
    serviceId: CLIENT_ID,
    timestamp: new Date().toISOString()
  };
  const message = Buffer.from(JSON.stringify(event));

  try {
    channel.publish(EXCHANGE_NAME, ROUTING_KEY, message);
    console.log(`[${CLIENT_ID}] Sent event: ${JSON.stringify(event)}`);
  } catch (error) {
    console.error(`[${CLIENT_ID}] Error publishing event: ${error.message}`);
    // Handle potential channel closure, attempt reconnection
    channel = null; 
    connectRabbitMQ();
  }
};

// Connect to RabbitMQ
connectRabbitMQ();

// Publish an event every 10 seconds
setInterval(publishEvent, 10000);

app.get('/', (req, res) => {
  res.send(`Cliente App instance ${CLIENT_ID} is running and publishing to RabbitMQ.`);
});

app.listen(PORT, () => {
  console.log(`Cliente App ${CLIENT_ID} listening on port ${PORT}`);
});
