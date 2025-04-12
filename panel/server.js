const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;
const API_REPORTE_URL = 'http://api-reporte:3000/reporte';
const API_RECENT_URL = 'http://api-reporte:3000/reporte/recent';
const AUTH = {
  username: 'admin',
  password: 'password'
};

let latestReportData = "Aun no hay datos...";
let latestRecentMessages = [];

// Function to fetch data from api-reporte
async function fetchData() {
  try {
    // Fetch main report (plaintext)
    const reportResponse = await axios.get(API_REPORTE_URL, { auth: AUTH });
    latestReportData = reportResponse.data.replace(/\n/g, '<br>'); // Keep line breaks for HTML
    console.log("Fetched Report Data:\n", reportResponse.data);

    // Fetch recent messages (json)
    const recentResponse = await axios.get(API_RECENT_URL, { auth: AUTH });
    latestRecentMessages = recentResponse.data;
    console.log("Fetched Recent Messages:", latestRecentMessages);

  } catch (error) {
    const errorMsg = `Error fetching data: ${error.response?.status} ${error.response?.data || error.message}`;
    console.error(errorMsg);
    latestReportData = errorMsg;
    latestRecentMessages = [];
  }
}

// Fetch data periodically (e.g., every 5 seconds)
fetchData(); // Initial fetch
setInterval(fetchData, 5000);

// Endpoint to display the panel
app.get('/', (req, res) => {
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="refresh" content="5"> <!-- Auto-refresh page every 5s -->
      <title>Panel de Monitoreo</title>
      <style>
        body { font-family: sans-serif; }
        table { border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        pre { background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; white-space: pre-wrap; word-wrap: break-word; }
      </style>
    </head>
    <body>
      <h1>Panel de Monitoreo</h1>
      <h2>Reporte Agregado</h2>
      <pre>${latestReportData}</pre>
      
      <h2>Ultimos Eventos Recibidos (via RabbitMQ)</h2>
  `;

  if (latestRecentMessages.length > 0) {
    html += '<table><thead><tr><th>Timestamp</th><th>Contenido del Evento</th></tr></thead><tbody>';
    // Display newest first
    [...latestRecentMessages].reverse().forEach(msg => {
      html += `<tr><td>${msg.timestamp}</td><td><pre>${JSON.stringify(msg.content, null, 2)}</pre></td></tr>`;
    });
    html += '</tbody></table>';
  } else {
    html += '<p>No hay eventos recientes.</p>';
  }

  html += `
    </body>
    </html>
  `;
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Panel service listening on port ${PORT}`);
}); 