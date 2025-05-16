const express = require('express');
const router = express.Router();
const superagent = require('superagent');

// Proxy endpoint for FPL live data for a specific event (gameweek)
router.get('/event/:eventId/live/', async (req, res) => {
  try {
    const { eventId } = req.params;
    const response = await superagent.get(`https://fantasy.premierleague.com/api/event/${eventId}/live/`);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (event live):', err.message);
    res.status(500).json({ error: 'Failed to fetch event live data', details: err.message });
  }
});

module.exports = router;
