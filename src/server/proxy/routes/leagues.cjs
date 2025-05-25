const express = require('express');
const router = express.Router();
const superagent = require('superagent');

// Endpoint to get classic league standings
router.get('/leagues-classic/:leagueId/standings/', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const response = await superagent.get(`https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (leagues-classic):', err.message);
    res.status(500).json({ error: 'Failed to fetch classic league standings', details: err.message });
  }
});

// Endpoint to get h2h league standings
router.get('/leagues-h2h/:leagueId/standings/', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const response = await superagent.get(`https://fantasy.premierleague.com/api/leagues-h2h/${leagueId}/standings/`);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (leagues-h2h):', err.message);
    res.status(500).json({ error: 'Failed to fetch h2h league standings', details: err.message });
  }
});

module.exports = router;
