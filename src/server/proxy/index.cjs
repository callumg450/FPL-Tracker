const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
app.use(cors());  // Allow all origins temporarily for debugging

// Add CORS headers manually as backup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json());

// Add a health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'healthy' });
});

// Import and mount the new route files
const bootstrapRoutes = require('./routes/bootstrap.cjs');
const fixturesRoutes = require('./routes/fixtures.cjs');
const playersRoutes = require('./routes/players.cjs');
const userRoutes = require('./routes/user.cjs');
const leaguesRoutes = require('./routes/leagues.cjs');
const eventRoutes = require('./routes/event.cjs');
const entryTransfersRoutes = require('./routes/entry-transfers.cjs');

// Mount routers
app.use('/api', bootstrapRoutes.router || bootstrapRoutes);
app.use('/api', fixturesRoutes.router || fixturesRoutes);
app.use('/api', playersRoutes);
app.use('/api', userRoutes);
app.use('/api', leaguesRoutes);
app.use('/api', eventRoutes);
app.use('/api', entryTransfersRoutes);

// Add request logging middleware to debug routing
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  next();
});

// Add catch-all route for non-existing endpoints
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Not Found' });
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`FPL Proxy server running on port ${process.env.PORT || PORT}`);
});