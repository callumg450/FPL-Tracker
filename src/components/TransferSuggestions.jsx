import React, { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:5000/api';

const TransferSuggestions = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user team (current GW)
        const teamRes = await fetch(`${API_BASE}/user-team/${userId}`);
        if (!teamRes.ok) throw new Error('Could not fetch user team');
        const teamData = await teamRes.json();
        // Fetch all player data
        const playerRes = await fetch(`${API_BASE}/bootstrap-static`);
        if (!playerRes.ok) throw new Error('Could not fetch player data');        const playerData = await playerRes.json();
        // --- Suggestion Logic ---
        const teamsData = playerData.teams;
        const allPlayersData = playerData.elements.map(player => ({
          ...player,
          team_short_name: teamsData.find(t => t.id === player.team)?.short_name || ''
        }));
        setTeams(teamsData);
        setAllPlayers(allPlayersData);

        const userPicks = teamData.picks || [];
        const userPlayerIds = userPicks.map(p => p.element);
        const userPlayers = allPlayersData.filter(p => userPlayerIds.includes(p.id));
        const userBank = (teamData.transfers && typeof teamData.transfers.bank === 'number')
          ? teamData.transfers.bank / 10
          : 0;
        // 1. Find flagged (injured/suspended) and poor form players
        const flagged = userPlayers.filter(p => p.status !== 'a');
        const poorForm = userPlayers.filter(p => p.status === 'a' && parseFloat(p.form) < 2.5);
        // 2. For each, find a replacement
        const suggestions = [];
        // Fetch fixtures for the next gameweek
        const events = playerData.events || [];
        const currentEvent = events.find(e => e.is_current);
        const nextEvent = events.find(e => e.is_next);
        const gwId = nextEvent ? nextEvent.id : (currentEvent ? currentEvent.id : null);
        let fixtures = [];
        if (gwId) {
          // Fetch fixtures for the next gameweek from the proxy
          const fixturesRes = await fetch(`${API_BASE}/fixtures?event=${gwId}`);
          if (fixturesRes.ok) {
            fixtures = await fixturesRes.json();
          }
        }
        const getFixtureShort = (player) => {
          const team = teamsData.find(t => t.id === player.team);
          if (!team || !fixtures.length) return '';
          // Find the fixture for this team in the next gameweek
          const fixture = fixtures.find(f => f.team_h === team.id || f.team_a === team.id);
          if (!fixture) return '';
          const oppId = fixture.team_h === team.id ? fixture.team_a : fixture.team_h;
          const oppTeam = teamsData.find(t => t.id === oppId);
          const homeAway = fixture.team_h === team.id ? 'H' : 'A';
          return oppTeam ? `${oppTeam.short_name} (${homeAway})` : '';
        };
        // Helper to get fixture difficulty for a player in the next GW
        const getNextFixtureDifficulty = (player) => {
          const team = teamsData.find(t => t.id === player.team);
          if (!team || !fixtures.length) return null;
          const fixture = fixtures.find(f => f.team_h === team.id || f.team_a === team.id);
          if (!fixture) return null;
          // FPL API: team_h_difficulty and team_a_difficulty (1 easiest, 5 hardest)
          return fixture.team_h === team.id ? fixture.team_h_difficulty : fixture.team_a_difficulty;
        };
        const alreadyInTeam = (id) => userPlayerIds.includes(id);
        const findReplacement = (outPlayer) => {
          return allPlayersData
            .filter(p =>
              p.element_type === outPlayer.element_type &&
              p.status === 'a' &&
              !alreadyInTeam(p.id) &&
              parseFloat(p.form) > 4.0 &&
              p.now_cost <= outPlayer.now_cost + userBank * 10 &&
              getNextFixtureDifficulty(p) !== null &&
              getNextFixtureDifficulty(p) <= 3 // Only suggest if next fixture is not too difficult
            )
            .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
            [0];
        };
        // Flagged players
        for (const p of flagged) {
          const replacement = findReplacement(p);
          if (replacement) {
            suggestions.push({
              out: p.web_name,
              in: replacement.web_name,
              reason: p.status === 'i' ? 'Injury' : p.status === 'd' ? 'Doubtful' : 'Suspension',
              outForm: parseFloat(p.form),
              inForm: parseFloat(replacement.form),
              nextFixture: getFixtureShort(replacement),
            });
          }
        }
        // Poor form players (avoid duplicates)
        for (const p of poorForm) {
          if (flagged.includes(p)) continue;
          const replacement = findReplacement(p);
          if (replacement) {
            suggestions.push({
              out: p.web_name,
              in: replacement.web_name,
              reason: 'Poor Form',
              outForm: parseFloat(p.form),
              inForm: parseFloat(replacement.form),
              nextFixture: getFixtureShort(replacement),
            });
          }
        }
        setSuggestions(suggestions);      } catch (err) {
        console.error('Transfer suggestions error:', err);
        setError(`Failed to fetch transfer suggestions: ${err.message}`);
      }
      setLoading(false);
    };
    fetchSuggestions();
  }, [userId]);

  if (!userId) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Transfer Suggestions</h2>
        <div className="text-gray-500">Enter your FPL User ID above to see transfer suggestions.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-bold mb-2">Transfer Suggestions</h2>
      {loading && <div>Loading suggestions...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && suggestions.length === 0 && (
        <div>No suggestions at this time.</div>
      )}
      {!loading && !error && suggestions.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {suggestions.map((s, idx) => (
            <li key={idx} className="py-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-700">OUT:</span> {s.out}                <span className="text-xs text-gray-500 ml-1">
                  ({allPlayers.find(p => p.web_name === s.out)?.team_short_name || ''})
                </span>
                <span className="mx-1">&rarr;</span>
                <span className="font-semibold text-green-700">IN:</span> {s.in}
                <span className="text-xs text-gray-500 ml-1">
                  ({allPlayers.find(p => p.web_name === s.in)?.team_short_name || ''})
                </span>
                <div className="text-xs text-gray-500">Reason: {s.reason} | Form: {s.outForm} &rarr; {s.inForm} | Next: {s.nextFixture}</div>
              </div>
              <button className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">Compare</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransferSuggestions;
