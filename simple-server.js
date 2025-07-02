import express from 'express';
const app = express();
const PORT = 3002;

// Middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Webhook route
app.get('/webhook', (req, res) => {
  console.log('GET /webhook called');
  res.json({ message: 'Webhook GET endpoint working!' });
});

app.post('/webhook', (req, res) => {
  console.log('POST /webhook called');
  console.log('Body:', req.body);
  res.json({ message: 'Webhook POST endpoint working!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple server started on port ${PORT}`);
  console.log(`📡 Available at: http://localhost:${PORT}`);
  console.log(`📡 External access: http://192.168.1.3:${PORT}`);
  console.log(`🔗 Webhook endpoint: http://192.168.1.3:${PORT}/webhook`);
});
