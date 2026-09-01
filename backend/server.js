/**
 * LegalCheck AI - Server Entrypoint
 * Department of Consumer Affairs - Legal Metrology Division
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static sample images and uploaded files
app.use('/sample-images', express.static(path.join(__dirname, '../sample-data/images')));
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// Mount API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', system: 'LegalCheck AI Engine', time: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  LEGALCHECK AI - Legal Metrology Inspector Backend   `);
  console.log(`  Department of Consumer Affairs, Govt. of India       `);
  console.log(`  Server running on http://localhost:${PORT}             `);
  console.log(`=======================================================`);
});

module.exports = app;
