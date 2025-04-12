const express = require('express');

const app = express();
app.use(express.text()); // Use text middleware to read the raw body
const PORT = 3000;

// Endpoint to receive logs
app.post('/logs', (req, res) => {
  const logMessage = req.body; // Log message is the raw text body
  const clientIp = req.ip; // Get client IP
  console.log(`Log received from ${clientIp}: ${logMessage}`);
  
  // Here you could store the logMessage to a file or in-memory array
  // For simplicity, we just log to console.

  res.type('text/plain').send('registro recibido');
});

app.listen(PORT, () => {
  console.log(`logger-central listening on port ${PORT}`);
}); 