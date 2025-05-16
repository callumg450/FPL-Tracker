process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const cache = require('./cache.cjs');
let fplSessionCookie = null;
let fplUserId = null;

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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
app.get('/api/bootstrap-static', async (req, res) => {
  try {
    const bootstrap = await fetchBootstrap();
    res.json(bootstrap);
  } catch (err) {
    console.error('Proxy error (bootstrap-static):', err);
    res.status(500).json({ error: 'Failed to fetch bootstrap-static', details: err.message });
  }
});

// Helper function to fetch fixtures
async function fetchFixtures(eventId) {
  // Use specific cache keys for different gameweeks
  const cacheKey = eventId ? `FIXTURES_GW_${eventId}` : 'FIXTURES_ALL';
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  console.log(`fetchFixtures not in cache for ${cacheKey}, fetching from FPL API`);
  const query = eventId !== undefined ? '?event=' + eventId : '';
  const response = await superagent.get(`https://fantasy.premierleague.com/api/fixtures/${query}`);
  cache.set(cacheKey, response.body);
  console.log(`fetchFixtures cached data for ${cacheKey}`);
  return response.body;
}

// Endpoint to get fixtures for a specific gameweek
app.get('/api/fixtures', async (req, res) => {
  try {
    const { event } = req.query;
    const fixtures = await fetchFixtures(event);
    res.json(fixtures);
  } catch (err) {
    console.error('Proxy error (fixtures):', err);
    res.status(500).json({ error: 'Failed to fetch fixtures', details: err.message });
  }
});

// Endpoint to get player summary (element-summary)
app.get('/api/element-summary/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const response = await superagent.get(`https://fantasy.premierleague.com/api/element-summary/${playerId}/`);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (element-summary):', err);
    res.status(500).json({ error: 'Failed to fetch player summary', details: err.message });
  }
});

// Endpoint to get a user's team for a specific gameweek (public, no login required)
app.get('/api/user-team/:userId/:eventId', async (req, res) => {
  try {
    const { userId, eventId } = req.params;

    const cacheKey = `USER_TEAM_GW_${userId}_${eventId}`;
    const cached = cache.get(cacheKey);
    if (cached){
      console.log(`Cache hit for ${cacheKey}`); 
      return cached;
    }

    const response = await superagent.get(`https://fantasy.premierleague.com/api/entry/${userId}/event/${eventId}/picks/`);
    res.json(response.body);
    cache.set(cacheKey, response.body);
  } catch (err) {
    console.error('Proxy error (user-team):', err.message);
    res.status(500).json({ error: 'Failed to fetch user team', details: err.message });
  }
});

// Endpoint to get a user's team for the current gameweek (public, no login required)
app.get('/api/user-team/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const eventId = await getCurrentGameweek();

    const cacheKey = `USER_TEAM_GW_${userId}_${eventId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`); 
      return cached;
    }

    if (!eventId) throw new Error('Could not determine current gameweek');
    const response = await superagent.get(`https://fantasy.premierleague.com/api/entry/${userId}/event/${eventId}/picks/`);
    res.json(response.body);
    cache.set(cacheKey, response.body);
  } catch (err) {
    console.error('Proxy error (user-team):', err);
    res.status(500).json({ error: 'Failed to fetch user team', details: err.message });
  }
});

// Proxy endpoint for FPL live data for a specific event (gameweek)
app.get('/api/event/:eventId/live/', async (req, res) => {
  try {
    const { eventId } = req.params;
    const response = await superagent.get(`https://fantasy.premierleague.com/api/event/${eventId}/live/`);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (event live):', err.message);
    res.status(500).json({ error: 'Failed to fetch event live data', details: err.message });
  }
});

// Endpoint to get entry history (ranks, points, etc) for a user
app.get('/api/entry-history/:userId', async (req, res) => {
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
app.get('/api/user-leagues/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    // Classic leagues
    const entryRes = await superagent.get(`https://fantasy.premierleague.com/api/entry/${userId}/`);
    const classic = entryRes.body.leagues?.classic || [];
    const h2h = entryRes.body.leagues?.h2h || [];
    res.json({ classic, h2h });
  } catch (err) {
    console.error('Proxy error (user-leagues):', err.message);
    res.status(500).json({ error: 'Failed to fetch user leagues', details: err.message });
  }
});

// Endpoint to get classic league standings
app.get('/api/leagues-classic/:leagueId/standings/', async (req, res) => {
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
app.get('/api/leagues-h2h/:leagueId/standings/', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const response = await superagent.get(`https://fantasy.premierleague.com/api/leagues-h2h/${leagueId}/standings/`);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (leagues-h2h):', err.message);
    res.status(500).json({ error: 'Failed to fetch h2h league standings', details: err.message });
  }
});

// Endpoint to get overall league standings for a specific gameweek (simple, no userId logic)
app.get('/api/overall-league-standings/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const overallLeagueId = 314;
    // Just fetch the first page (top 50) for the event
    const response = await superagent.get(`https://fantasy.premierleague.com/api/leagues-classic/${overallLeagueId}/standings/?event=${eventId}&page_standings=1`);
    res.json(response.body);
  } catch (err) {
    console.error('Proxy error (overall-league-standings):', err.message);
    res.status(500).json({ error: 'Failed to fetch overall league standings', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`FPL Proxy server running on http://localhost:${PORT}`);
});