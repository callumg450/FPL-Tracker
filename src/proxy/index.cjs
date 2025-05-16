process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Import and mount the new route files
const bootstrapRoutes = require('./routes/bootstrap.cjs');
const fixturesRoutes = require('./routes/fixtures.cjs');
const playersRoutes = require('./routes/players.cjs');
const userRoutes = require('./routes/user.cjs');
const leaguesRoutes = require('./routes/leagues.cjs');
const eventRoutes = require('./routes/event.cjs');

// Mount routers
app.use('/api', bootstrapRoutes.router || bootstrapRoutes);
app.use('/api', fixturesRoutes.router || fixturesRoutes);
app.use('/api', playersRoutes);
app.use('/api', userRoutes);
app.use('/api', leaguesRoutes);
app.use('/api', eventRoutes);

app.listen(PORT, () => {
  console.log(`FPL Proxy server running on http://localhost:${PORT}`);
});