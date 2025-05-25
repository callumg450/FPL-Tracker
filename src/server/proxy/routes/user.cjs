const express = require('express');
const router = express.Router();
const cache = require('../cache.cjs');
const superagent = require('superagent');
const { getCurrentGameweek } = require('./bootstrap.cjs');

// Endpoint to get a user's team for a specific gameweek
router.get('/user-team/:userId/:eventId', async (req, res) => {
  try {
    const { userId, eventId } = req.params;
    const cacheKey = `USER_TEAM_GW_${userId}_${eventId}`;
    const cached = cache.get(cacheKey);
    if (cached){
      return res.json(cached);
    }
    const response = await superagent.get(`https://fantasy.premierleague.com/api/entry/${userId}/event/${eventId}/picks/`);
    cache.set(cacheKey, response.body);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (user-team):', err.message);
    res.status(500).json({ error: 'Failed to fetch user team', details: err.message });
  }
});

// Endpoint to get a user's team for the current gameweek
router.get('/user-team/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const eventId = await getCurrentGameweek();
    const cacheKey = `USER_TEAM_GW_${userId}_${eventId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    if (!eventId) throw new Error('Could not determine current gameweek');
    const response = await superagent.get(`https://fantasy.premierleague.com/api/entry/${userId}/event/${eventId}/picks/`);
    cache.set(cacheKey, response.body);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (user-team):', err);
    res.status(500).json({ error: 'Failed to fetch user team', details: err.message });
  }
});

// Endpoint to get entry history (ranks, points, etc) for a user
router.get('/entry-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const fplApiUrl = `https://fantasy.premierleague.com/api/entry/${userId}/history/`;
    const response = await superagent.get(fplApiUrl);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (entry-history):', err.message);
    res.status(500).json({ error: 'Failed to fetch entry history', details: err.message });
  }
});

// Endpoint to get all leagues for a user (classic and h2h)
router.get('/user-leagues/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const entryRes = await superagent.get(`https://fantasy.premierleague.com/api/entry/${userId}/`);
    const classic = entryRes.body.leagues?.classic || [];
    const h2h = entryRes.body.leagues?.h2h || [];
    res.json({ classic, h2h });
  } catch (err) {
    console.error('Proxy error (user-leagues):', err.message);
    res.status(500).json({ error: 'Failed to fetch user leagues', details: err.message });
  }
});

module.exports = router;
