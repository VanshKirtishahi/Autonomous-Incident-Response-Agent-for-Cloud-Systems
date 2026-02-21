// src/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const IncidentAgent = require('./services/IncidentAgent');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize agent so it's available to routes immediately
const agent = new IncidentAgent();
app.set('agent', agent);

app.use('/api', apiRoutes);

// Use 127.0.0.1 to avoid IPv6 resolution issues
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vanshkirtishahi_db_user:ZpIdvzIPQBvno3zN@cloudsystems.j41inve.mongodb.net/';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await agent.seedData(); // Seed the dummy data
    agent.startMonitoring(); // Start background metric generation
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    // Do not call agent methods here if they rely on a DB connection
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});