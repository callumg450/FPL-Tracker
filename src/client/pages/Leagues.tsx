import React, { useState, useEffect } from 'react';
import TeamFormation from '../components/TeamFormation';

// Types for league standings
interface LeagueEntry {
  id: number;
  entry_name: string;
  player_name: string;
  total: number;
  event_total: number;
  rank: number;
  last_rank: number;
  [key: string]: any;
}
interface UserLeague {
  id: number;
  name: string;
  league_type: string;
  admin_entry: number;
  [key: string]: any;
}

const Leagues: React.FC<{ userId?: string }> = ({ userId }) => {
  const [leagues, setLeagues] = useState<UserLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<UserLeague | null>(null);
  const [standings, setStandings] = useState<LeagueEntry[]>([]);
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LeagueEntry | null>(null);
  const [entryPicks, setEntryPicks] = useState<any | null>(null);
  const [loadingPicks, setLoadingPicks] = useState(false);

  // Fetch user's leagues on mount or when userId changes
  useEffect(() => {
    if (!userId) return;
    setLoadingLeagues(true);
    setError(null);
    fetch(`http://localhost:5000/api/user-leagues/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user leagues');
        return res.json();
      })
      .then(data => {
        // Merge classic and h2h leagues
        const classic = data.classic || [];
        const h2h = data.h2h || [];
        setLeagues([...classic, ...h2h]);
      })
      .catch(err => setError(err.message || 'Fetch failed'))
      .finally(() => setLoadingLeagues(false));
  }, [userId]);

  // Fetch standings for selected league
  const fetchStandings = async (league: UserLeague) => {
    setLoading(true);
    setError(null);
    setStandings([]);
    setLeagueName('');
    try {
      const url =
        league.league_type === 'h' // h2h
          ? `http://localhost:5000/api/leagues-h2h/${league.id}/standings/`
          : `http://localhost:5000/api/leagues-classic/${league.id}/standings/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch league standings');
      const data = await res.json();
      setStandings(data.standings?.results || []);
      setLeagueName(data.league?.name || '');
    } catch (err: any) {
      setError(err.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  // When a league is selected, fetch its standings
  useEffect(() => {
    if (selectedLeague) fetchStandings(selectedLeague);
  }, [selectedLeague]);

  // Helper: get the current gameweek/event from the league API (not from standings data)
  const [currentEventId, setCurrentEventId] = useState<number | null>(null);

  // Fetch current gameweek on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/bootstrap-static')
      .then(res => res.json())
      .then(data => {
        const currentEvent = data.events?.find((e: any) => e.is_current);
        setCurrentEventId(currentEvent ? currentEvent.id : null);
      });
  }, []);

  // Fetch picks for a selected entry (team) for the current gameweek
  const fetchEntryPicks = async (entry: LeagueEntry) => {
    if (!selectedLeague) return;
    setLoadingPicks(true);
    setEntryPicks(null);
    setSelectedEntry(entry);
    try {
      // Always use the current gameweek for team picks
      if (!currentEventId) throw new Error('Current gameweek not found');
      const res = await fetch(`http://localhost:5000/api/user-team/${entry.entry}/${currentEventId}`);
      if (!res.ok) throw new Error('Failed to fetch team picks');
      const data = await res.json();
      setEntryPicks(data);
    } catch (err) {
      setEntryPicks({ error: err.message || 'Fetch failed' });
    } finally {
      setLoadingPicks(false);
    }
  };

  const [allPlayers, setAllPlayers] = useState<any[]>([]);

  // Fetch all players on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/bootstrap-static')
      .then(res => res.json())
      .then(data => setAllPlayers(data.elements || []));
  }, []);

  const [liveData, setLiveData] = useState<any[]>([]);

  // Fetch live data for the current gameweek (for player points in modal)
  useEffect(() => {
    if (!currentEventId) return;
    fetch(`http://localhost:5000/api/event/${currentEventId}/live/`)
      .then(res => res.json())
      .then(data => setLiveData(data.elements || []));
  }, [currentEventId]);

  const [teams, setTeams] = useState<any[]>([]);
  // Fetch all teams on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/bootstrap-static')
      .then(res => res.json())
      .then(data => setTeams(data.teams || []));
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 mt-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">League Standings Comparison</h1>
      {loadingLeagues ? (
        <div className="text-center text-gray-500">Loading your leagues...</div>
      ) : error ? (
        <div className="text-red-500 text-center mb-4">{error}</div>
      ) : leagues.length === 0 ? (
        <div className="text-center text-gray-500">No leagues found for this user.</div>
      ) : !selectedLeague ? (
        <div>
          <h2 className="text-xl font-semibold text-center mb-4">Your Leagues</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {leagues.map(league => (
              <button
                key={league.id}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded px-4 py-3 shadow font-bold min-w-[200px] text-center border border-indigo-200"
                onClick={() => setSelectedLeague(league)}
              >
                <div className="text-lg">{league.name}</div>
                <div className="text-xs mt-1">{league.league_type === 'h' ? 'Head-to-Head' : 'Classic'}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <button
            className="mb-4 text-indigo-600 hover:underline font-semibold"
            onClick={() => {
              setSelectedLeague(null);
              setStandings([]);
              setLeagueName('');
            }}
          >
            ← Back to Leagues
          </button>
          <div className="text-center text-xl font-semibold text-indigo-700 mb-4">{leagueName}</div>
          {loading ? (
            <div className="text-center text-gray-500">Loading standings...</div>
          ) : (
            <>
              {standings.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr className="bg-indigo-100">
                        <th className="px-2 py-1 border">Rank</th>
                        <th className="px-2 py-1 border">Team</th>
                        <th className="px-2 py-1 border">Manager</th>
                        <th className="px-2 py-1 border">GW Points</th>
                        <th className="px-2 py-1 border">Hits</th>
                        <th className="px-2 py-1 border">Total Points</th>
                        <th className="px-2 py-1 border">Rank Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map(entry => (
                        <tr key={entry.id} className="text-center hover:bg-indigo-50 cursor-pointer" onClick={() => fetchEntryPicks(entry)}>
                          <td className="border px-2 py-1 font-bold">{entry.rank}</td>
                          <td className="border px-2 py-1">{entry.entry_name}</td>
                          <td className="border px-2 py-1">{entry.player_name}</td>
                          <td className="border px-2 py-1">{entry.event_total}</td>
                          <td className="border px-2 py-1">{typeof entry.event_transfers_cost === 'number' ? -entry.event_transfers_cost : 0}</td>
                          <td className="border px-2 py-1">{entry.total}</td>
                          <td className="border px-2 py-1">
                            {entry.last_rank && entry.rank
                              ? entry.last_rank - entry.rank > 0
                                ? <span className="text-green-600 font-bold">+{entry.last_rank - entry.rank}</span>
                                : entry.last_rank - entry.rank < 0
                                ? <span className="text-red-600 font-bold">{entry.last_rank - entry.rank}</span>
                                : <span className="font-bold">0</span>
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {standings.length === 0 && !loading && leagueName && (
                <div className="text-center text-gray-500 mt-4">No standings found for this league.</div>
              )}
            </>
          )}
        </>
      )}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full relative">
            <button className="absolute top-2 right-2 text-xl font-bold text-gray-500 hover:text-gray-800" onClick={() => { setSelectedEntry(null); setEntryPicks(null); }}>&times;</button>
            <h3 className="text-lg font-bold mb-2 text-indigo-800 text-center">{selectedEntry.entry_name} ({selectedEntry.player_name})</h3>
            {loadingPicks ? (
              <div className="text-center text-gray-500">Loading team...</div>
            ) : entryPicks && entryPicks.picks && entryPicks.picks.length > 0 ? (
              <>
                {/* Chips played info */}
                {entryPicks.active_chip && (
                  <div className="mb-2 text-center">
                    <span className="inline-block bg-indigo-200 text-indigo-900 rounded px-3 py-1 font-semibold text-sm">
                      Chip played: {entryPicks.active_chip.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                )}
                <TeamFormation picks={entryPicks.picks} players={allPlayers} liveData={liveData} showPoints={true} teams={teams} />
              </>
            ) : entryPicks && entryPicks.error ? (
              <div className="text-center text-red-500">{entryPicks.error}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leagues;
