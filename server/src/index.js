const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CMMC API is running' });
});

app.get('/api/dashboard', (req, res) => {
  res.json({
    stats: {
      users: 150,
      activeProjects: 12,
      completedTasks: 847
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
