require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// Middleware
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Static Files — serve frontend
// ==========================================
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));
app.use('/app.js', express.static(path.join(__dirname, 'app.js')));

// ==========================================
// Health Check
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// Page Routes
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ==========================================
// 404 Handler
// ==========================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ==========================================
// Global Error Handler
// ==========================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.'
  });
});

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Skynet Global Logistics running on http://localhost:${PORT}`);
  console.log(`   Admin: http://localhost:${PORT}/admin`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;
