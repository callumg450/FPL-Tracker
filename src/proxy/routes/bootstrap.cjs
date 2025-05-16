const express = require('express');
const router = express.Router();
const cache = require('../cache.cjs');
const superagent = require('superagent');

// Helper function to fetch bootstrap-static
async function fetchBootstrap() {
  const cached = cache.get('BOOTSTRAP');
  if (cached) {
    return cached;
  }
  console.log('fetchBootstrap not in cache, fetching from FPL API');
  const response = await superagent.get('https://fantasy.premierleague.com/api/bootstrap-static/');
  cache.set('BOOTSTRAP', response.body);
  return response.body;
}

// Helper function to get the current gameweek
const getCurrentGameweek = async () => {
  const bootstrap = await fetchBootstrap();
  const currentEvent = bootstrap.events.find(e => e.is_current);
  return currentEvent ? currentEvent.id : null;
};

// Endpoint to get teams and current gameweek
router.get('/bootstrap-static', async (req, res) => {
  try {
    const bootstrap = await fetchBootstrap();
    res.json(bootstrap);
  } catch (err) {
    console.error('Proxy error (bootstrap-static):', err);
    res.status(500).json({ error: 'Failed to fetch bootstrap-static', details: err.message });
  }
});

module.exports = { router, fetchBootstrap, getCurrentGameweek };
