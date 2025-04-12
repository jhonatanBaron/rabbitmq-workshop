const express = require('express');
const basicAuth = require('basic-auth');
const amqp = require('amqplib');

const app = express();
app.use(express.json());
const PORT = 3000;

const RABBITMQ_URL = 'amqp://user:password@rabbitmq:5672';
const EXCHANGE_NAME = 'events_exchange';
const QUEUE_NAME = 'analytics_queue';
const ROUTING_KEY = 'event.analytics';

// In-memory store for counts by serviceId
const requestCounts = {};
const recentMessages = []; // Store last N messages
const MAX_RECENT_MESSAGES = 5;

// Basic authentication middleware (redundant as Traefik handles it, but kept)
const auth = (req, res, next) => {
  const user = basicAuth(req);
  const validUser = 'admin';
  const validPass = 'password';
  if (!user || user.name !== validUser || user.pass !== validPass) {
    res.set('WWW-Authenticate', 'Basic realm="api-reporte"');
    return res.status(401).send('Authentication required.');
  }
  next();
};

// Function to connect to RabbitMQ and start consuming
async function connectAndConsume() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    const q = await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, ROUTING_KEY);
    
    console.log(`Connected to RabbitMQ. Waiting for messages in ${q.queue}`);

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        const rawMessage = msg.content.toString();
        try {
          const event = JSON.parse(rawMessage);
          
          // Store recent message
          recentMessages.push({ timestamp: new Date().toISOString(), content: event });
          if (recentMessages.length > MAX_RECENT_MESSAGES) {
            recentMessages.shift(); // Keep only the last N
          }

          if (event.serviceId) {
            requestCounts[event.serviceId] = (requestCounts[event.serviceId] || 0) + 1;
            console.log(`Processed event from ${event.serviceId}. Current count: ${requestCounts[event.serviceId]}`);
          } else {
            console.warn('Received event without serviceId:', event);
          }
          channel.ack(msg);
        } catch (parseError) {
          console.error('Error parsing message:', parseError);
          channel.nack(msg, false, false); // Discard unparsable message
        }
      }
    });

  } catch (error) {
    console.error('Error connecting to RabbitMQ or consuming:', error.message);
    // Retry connection after a delay
    setTimeout(connectAndConsume, 5000);
  }
}

// Endpoint to view the current status (protected by basic auth)
app.get('/reporte', auth, (req, res) => {
  // Format the counts into a plaintext string
  let report = 'Reporte de Accesos:\n';
  for (const [serviceId, count] of Object.entries(requestCounts)) {
    report += `${serviceId}: ${count}\n`;
  }
  res.type('text/plain');
  res.send(report || 'No hay datos aun.');
});

// Add a new endpoint to get recent messages (could be protected too if needed)
app.get('/reporte/recent', auth, (req, res) => { 
  res.json(recentMessages);
});

// Start the server and connect to RabbitMQ
app.listen(PORT, () => {
  console.log(`api-reporte listening on port ${PORT}`);
  connectAndConsume();
});
