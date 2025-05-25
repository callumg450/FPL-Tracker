import React, { useState, useEffect } from 'react';
import TeamFormation from '../components/TeamFormation';
import TransferSuggestions from '../components/TransferSuggestions';
import { useFplData } from '../contexts/FplDataContext.jsx';

const POSITION_MAP: Record<number, string> = {
  1: 'Goalkeeper',
  2: 'Defender',
  3: 'Midfielder',
  4: 'Forward',
};

interface MyTeamProps {}

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
  is_captain: boolean;
  is_vice_captain: boolean;
  [key: string]: any;
}
interface Team {
  id: number;
  name: string;
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
interface Event {
  id: number;
  name: string;
  is_current?: boolean;
  [key: string]: any;
}

const MyTeam: React.FC<MyTeamProps> = () => {
  const { userId, setUserId } = useFplData() as {
    userId: string;
    setUserId: (id: string) => void;
  };
  const [inputUserId, setInputUserId] = useState(userId || '');
  const [submittedUserId, setSubmittedUserId] = useState(userId || '');
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveData, setLiveData] = useState<LiveData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [entryHistory, setEntryHistory] = useState<EntryHistory | null>(null);
  const [fixtures, setFixtures] = useState([]);
  const { teams, players, events } = useFplData() as {
    teams: Team[];
    players: Player[];
    events: Event[];
    };

  // Fetch all players and events on mount
  useEffect(() => {
      const currentEvent = events.find((e: any) => e.is_current);
      setSelectedEventId(currentEvent ? currentEvent.id : null);
  }, []);

  // Always fetch live data for the selected gameweek
  useEffect(() => {
    if (!selectedEventId) {
      setLiveData([]); // Use empty array instead of null
      return;
    }    fetch(`${import.meta.env.VITE_BASE_URL}/event/${selectedEventId}/live/`)
      .then(res => res.json())
      .then(data => setLiveData(data.elements || []));
  }, [selectedEventId]);

  // Fetch team for selected gameweek (only when submittedUserId changes)
  useEffect(() => {
    if (!submittedUserId || !selectedEventId) return;
    setLoading(true);
    setError(null);
    setTeam(null);
    fetch(`${import.meta.env.VITE_BASE_URL}/user-team/${submittedUserId}/${selectedEventId}`)
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
    fetch(`${import.meta.env.VITE_BASE_URL}/entry-history/${submittedUserId}`)
      .then(res => res.json())
      .then(data => setEntryHistory(data));
  }, [submittedUserId]);

  // Fetch fixtures for selected gameweek
  useEffect(() => {
    if (!selectedEventId) return;
    fetch(`${import.meta.env.VITE_BASE_URL}/fixtures?event=${selectedEventId}`)
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

  // Helper to get total score and points hit for the selected gameweek
  const getGameweekInfo = () => {
    if (!team || !liveData || !entryHistory || !selectedEventId) return null;
    
    // Get total points
    let total = 0;
    team.picks.forEach((pick: any) => {
      if (pick.position <= 11) {
        const live = liveData.find((el: any) => el.id === pick.element);
        if (live) {
          total += live.stats.total_points * pick.multiplier;
        }
      }
    });

    // Get points hit
    const currentGW = entryHistory.current.find((gw: any) => gw.event === selectedEventId);
    const pointsHit = currentGW?.event_transfers_cost || 0;

    return { total, pointsHit };
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
      <form onSubmit={e => { 
        e.preventDefault(); 
        setSubmittedUserId(inputUserId);
        setUserId(inputUserId);
      }} className="space-y-4">
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
          {/* Total score and hits for the week */}
          <div className="text-center text-lg font-bold text-indigo-900 mb-2">
            {(() => {
              const info = getGameweekInfo();
              if (!info) return 'Total Score: N/A';
              return (
                <>
                  Total Score: {info.total}
                  {info.pointsHit > 0 && (
                    <span className="text-red-600 ml-2">(-{info.pointsHit} pts) = {info.total - info.pointsHit}</span>
                  )}
                </>
              );
            })()}
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
