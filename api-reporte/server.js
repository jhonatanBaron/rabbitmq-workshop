const express = require('express');
const basicAuth = require('basic-auth');

const app = express();
app.use(express.json());
const PORT = 3000;

// In-memory store for request counts by client
const requestCounts = {};

// Basic authentication middleware (for demonstration; Traefik also applies basic auth)
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

// Protected endpoint to register a request
app.post('/reporte', auth, (req, res) => {
  const serviceId = req.headers['x-service-id'];
  if (!serviceId) {
    return res.status(400).send('Missing X-Service-ID header.');
  }
  requestCounts[serviceId] = (requestCounts[serviceId] || 0) + 1;
  console.log(`Received request from ${serviceId}. Total: ${requestCounts[serviceId]}`);
  res.send(`Request registered for ${serviceId}. Count: ${requestCounts[serviceId]}`);
});

// Public endpoint to view the current status
app.get('/reporte', (req, res) => {
  res.json(requestCounts);
});

app.listen(PORT, () => {
  console.log(`api-reporte listening on port ${PORT}`);
});
