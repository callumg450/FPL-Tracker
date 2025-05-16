import React, { useState, useEffect } from 'react';
import TeamFormation from '../components/TeamFormation';
import TransferSuggestions from '../components/TransferSuggestions.jsx';

const POSITION_MAP: Record<number, string> = {
  1: 'Goalkeeper',
  2: 'Defender',
  3: 'Midfielder',
  4: 'Forward',
};

interface MyTeamProps {
  userId: string;
}

// Add types for team, player, pick, liveData, entryHistory
interface Player {
  id: number;
  element_type: number;
  web_name: string;
  [key: string]: any;
}
interface Pick {
  element: number;
  position: number;
  multiplier: number;
  [key: string]: any;
}
interface Team {
  picks: Pick[];
  [key: string]: any;
}
interface LiveData {
  id: number;
  stats: { total_points: number; bonus: number; minutes: number };
  [key: string]: any;
}
interface EntryHistory {
  current: Array<{ event: number; overall_rank: number } & Record<string, any>>;
  [key: string]: any;
}

const MyTeam: React.FC<MyTeamProps> = ({ userId }) => {
  const [inputUserId, setInputUserId] = useState(userId || '');
  const [submittedUserId, setSubmittedUserId] = useState(userId || '');
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveData, setLiveData] = useState<LiveData[]>([]);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [entryHistory, setEntryHistory] = useState<EntryHistory | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [fixtures, setFixtures] = useState([]);

  // Fetch all players and events on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/bootstrap-static')
      .then(res => res.json())
      .then(data => {
        setPlayers(data.elements || []);
        setEvents(data.events || []);
        const currentEvent = data.events.find((e: any) => e.is_current);
        setCurrentEventId(currentEvent ? currentEvent.id : null);
        setSelectedEventId(currentEvent ? currentEvent.id : null);
      });
  }, []);

  // Always fetch live data for the selected gameweek
  useEffect(() => {
    if (!selectedEventId) {
      setLiveData([]); // Use empty array instead of null
      return;
    }
    fetch(`http://localhost:5000/api/event/${selectedEventId}/live/`)
      .then(res => res.json())
      .then(data => {console.log(data.elements); setLiveData(data.elements || [])});
  }, [selectedEventId]);

  // Fetch team for selected gameweek (only when submittedUserId changes)
  useEffect(() => {
    if (!submittedUserId || !selectedEventId) return;
    setLoading(true);
    setError(null);
    setTeam(null);
    fetch(`http://localhost:5000/api/user-team/${submittedUserId}/${selectedEventId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch team');
        return res.json();
      })
      .then(teamData => setTeam(teamData))
      .catch(err => setError(err.message || 'Fetch failed'))
      .finally(() => setLoading(false));
  }, [submittedUserId, selectedEventId]);

  // Fetch entry history for user (only when submittedUserId changes)
  useEffect(() => {
    if (!submittedUserId) return;
    fetch(`http://localhost:5000/api/entry-history/${submittedUserId}`)
      .then(res => res.json())
      .then(data => setEntryHistory(data));
  }, [submittedUserId]);

  // Fetch all teams on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/bootstrap-static')
      .then(res => res.json())
      .then(data => setTeams(data.teams || []));
  }, []);

  // Fetch fixtures for selected gameweek
  useEffect(() => {
    if (!selectedEventId) return;
    fetch(`http://localhost:5000/api/fixtures?event=${selectedEventId}`)
      .then(res => res.json())
      .then(data => setFixtures(data || []));
  }, [selectedEventId]);

  useEffect(() => {
    setInputUserId(userId || '');
    setSubmittedUserId(userId || '');
  }, [userId]);

  // Map pick.element to player object
  const getPlayer = (elementId: number) => players.find(p => p.id === elementId);

  // Group picks by position for formation, and separate bench
  const formation: Record<string, any[]> = {
    Goalkeeper: [],
    Defender: [],
    Midfielder: [],
    Forward: [],
  };
  let bench: any[] = [];
  if (team && team.picks && players.length) {
    // Starting XI: position 1-11, Bench: 12-15
    team.picks.forEach((pick: any) => {
      const player = getPlayer(pick.element);
      if (player) {
        const pos = POSITION_MAP[player.element_type];
        if (pick.position <= 11) {
          if (formation[pos]) formation[pos].push({ ...player, pick });
        } else {
          bench.push({ ...player, pick });
        }
      }
    });
  }

  // Helper to get total score for the selected gameweek
  const getTotalScore = () => {
    if (!team || !liveData) return null;
    // Only count starting XI (position 1-11)
    let total = 0;
    team.picks.forEach((pick: any) => {
      if (pick.position <= 11) {
        const live = liveData.find((el: any) => el.id === pick.element);
        if (live) {
          // Account for captaincy/vice-captaincy
          total += live.stats.total_points * pick.multiplier;
        }
      }
    });
    return total;
  };

  // Helper to get current and previous GW rank
  const getRankInfo = () => {
    if (!entryHistory || !selectedEventId) return null;
    const currentArr = entryHistory.current || [];
    const currentGW = currentArr.find((g: any) => g.event === selectedEventId);
    const prevGW = currentArr.find((g: any) => g.event === selectedEventId - 1);
    if (!currentGW) return null;
    return {
      current: currentGW.overall_rank,
      previous: prevGW ? prevGW.overall_rank : null,
      diff: prevGW && currentGW.overall_rank && prevGW.overall_rank ? prevGW.overall_rank - currentGW.overall_rank : null
    };
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8 mt-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">View FPL Team</h1>
      {submittedUserId && <TransferSuggestions userId={submittedUserId} />}
      <form onSubmit={e => { e.preventDefault(); }} className="space-y-4">
        {/* Only show FPL User ID input if not already submitted */}
        {submittedUserId === '' && (
          <div>
            <label className="block font-semibold mb-1">FPL User ID</label>
            <input
              type="text"
              className="border rounded px-3 py-2 w-full"
              value={inputUserId}
              onChange={e => setInputUserId(e.target.value)}
              required
            />
          </div>
        )}
        <div className="flex justify-center">
          <select
            className="border rounded px-3 py-2 w-48"
            value={selectedEventId ?? ''}
            onChange={e => setSelectedEventId(Number(e.target.value))}
            disabled={events.length === 0}
          >
            {events.map((event: any) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-500 text-center">{error}</div>}
        {submittedUserId === '' && (
        <button
          type="button"
          className="bg-indigo-600 text-white px-6 py-2 rounded font-bold w-full"
          onClick={() => setSubmittedUserId(inputUserId)}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'View Team'}
        </button>
        )}
      </form>
      {team && players.length > 0 && (
        <div className="mt-8">
          {/* Total score for the week */}
          <div className="text-center text-lg font-bold text-indigo-900 mb-2">
            Total Score: {getTotalScore() !== null ? getTotalScore() : 'N/A'}
          </div>
          {/* Rank info */}
          {(() => {
            const rank = getRankInfo();
            if (!rank) return null;
            return (
              <div className="text-center text-base font-semibold text-gray-700 mb-4">
                <div>Overall Rank: <span className="font-bold">{rank.current ? rank.current.toLocaleString() : 'N/A'}</span></div>
                {rank.previous && (
                  <div>Previous GW Rank: <span className="font-bold">{rank.previous.toLocaleString()}</span></div>
                )}
                {rank.diff !== null && (
                  <div>
                    Rank Change: <span className={rank.diff > 0 ? 'text-green-600 font-bold' : rank.diff < 0 ? 'text-red-600 font-bold' : 'font-bold'}>
                      {rank.diff > 0 ? '+' : ''}{rank.diff}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
          <TeamFormation picks={team.picks} players={players} liveData={liveData} showPoints={true} teams={teams} fixtures={fixtures} />
        </div>
      )}
    </div>
  );
};

export default MyTeam;
