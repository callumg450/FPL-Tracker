const express = require('express');
const router = express.Router();
const superagent = require('superagent');

// Endpoint to get player summary (element-summary)
router.get('/element-summary/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const response = await superagent.get(`https://fantasy.premierleague.com/api/element-summary/${playerId}/`);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (element-summary):', err);
    res.status(500).json({ error: 'Failed to fetch player summary', details: err.message });
  }
});

module.exports = router;
