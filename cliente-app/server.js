const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;
const CLIENT_ID = process.env.CLIENT_ID || 'unknown-client';

// Function to send a POST request to api-reporte periodically
const sendRequest = async () => {
  try {
    const response = await axios.post('http://api-reporte:3000/reporte', {}, {
      headers: { 'X-Service-ID': CLIENT_ID },
      auth: { username: 'admin', password: 'password' }
    });
    console.log(`Response from api-reporte: ${response.data}`);
  } catch (error) {
    console.error(`Error sending request: ${error.message}`);
  }
};

// Send an initial request and then every 10 seconds
sendRequest();
setInterval(sendRequest, 10000);

app.get('/', (req, res) => {
  res.send(`Cliente App instance ${CLIENT_ID} is running.`);
});

app.listen(PORT, () => {
  console.log(`Cliente App ${CLIENT_ID} listening on port ${PORT}`);
});
