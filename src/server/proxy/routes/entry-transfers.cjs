// Proxy route for fetching transfers for a given entry (user)
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// GET /api/entry-transfers/:entryId
router.get('/entry-transfers/:entryId', async (req, res) => {
  const { entryId } = req.params;
  if (!entryId) return res.status(400).json({ error: 'Missing entryId' });
  try {
    // FPL API endpoint for transfers
    console.log(`[DEBUG] Fetching transfers for entryId: ${entryId}`);
    const url = `https://fantasy.premierleague.com/api/entry/${entryId}/transfers/`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch transfers' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
