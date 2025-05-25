const express = require('express');
const router = express.Router();
const cache = require('../cache.cjs');
const superagent = require('superagent');

// Helper function to fetch fixtures
async function fetchFixtures(eventId) {
  const cacheKey = eventId ? `FIXTURES_GW_${eventId}` : 'FIXTURES_ALL';
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  const query = eventId !== undefined ? '?event=' + eventId : '';
  const response = await superagent.get(`https://fantasy.premierleague.com/api/fixtures/${query}`);
  cache.set(cacheKey, response.body);
  return response.body;
}

// Endpoint to get fixtures for a specific gameweek
router.get('/fixtures', async (req, res) => {
  try {
    const { event } = req.query;
    const fixtures = await fetchFixtures(event);
    res.json(fixtures);
  } catch (err) {
    console.error('Proxy error (fixtures):', err);
    res.status(500).json({ error: 'Failed to fetch fixtures', details: err.message });
  }
});

module.exports = {router, fetchFixtures};
