import React, { useState, useEffect } from 'react';

const POSITION_MAP: Record<number, string> = {
  1: 'Goalkeeper',
  2: 'Defender',
  3: 'Midfielder',
  4: 'Forward',
};

interface MyTeamProps {
  userId: string;
}

const MyTeam: React.FC<MyTeamProps> = ({ userId }) => {
  const [inputUserId, setInputUserId] = useState(userId || '');
  const [submittedUserId, setSubmittedUserId] = useState(userId || '');
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [entryHistory, setEntryHistory] = useState(null);

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
      setLiveData(null);
      return;
    }
    fetch(`http://localhost:5000/api/event/${selectedEventId}/live/`)
      .then(res => res.json())
      .then(data => setLiveData(data.elements || []));
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

  // Helper to get points and bonus for a player for the selected gameweek
  const getPointsAndBonus = (elementId: number) => {
    if (liveData) {
      const live = liveData.find((el: any) => el.id === elementId);
      if (live && live.stats.minutes > 0) {
        return {
          points: live.stats.total_points,
          bonus: live.stats.bonus > 0 ? live.stats.bonus : null,
        };
      }
      return null;
    }
    return null;
  };

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
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-2xl p-8 mt-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">View FPL Team</h1>
      <form onSubmit={e => { e.preventDefault(); }} className="space-y-4">
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
        <div>
          <label className="block font-semibold mb-1">Gameweek</label>
          <select
            className="border rounded px-3 py-2 w-full"
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
        <button
          type="button"
          className="bg-indigo-600 text-white px-6 py-2 rounded font-bold w-full"
          onClick={() => setSubmittedUserId(inputUserId)}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'View Team'}
        </button>
      </form>
      {team && players.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700 text-center">Team for Current Gameweek</h2>
          {/* Total score for the week */}
          <div className="text-center text-lg font-bold text-indigo-900 mb-2">
            Total Score: {getTotalScore() !== null ? getTotalScore() : 'N/A'}
          </div>
          {/* Rank info */}
          {(() => {
            const rank = getRankInfo();
            console.log('Rank Info:', rank);
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
          <div className="flex flex-col items-center gap-4">
            {/* Goalkeeper */}
            <div className="flex justify-center mb-2">
              {formation.Goalkeeper.map(player => {
                const pts = getPointsAndBonus(player.id);
                return (
                  <div key={player.id} className="bg-blue-100 rounded px-4 py-2 mx-1 font-bold text-blue-900 shadow flex flex-col items-center">
                    {player.web_name} <span className="text-xs text-gray-500">(GK)</span>
                    {pts && (
                      <span className="text-xs text-blue-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Defenders */}
            <div className="flex justify-center mb-2 gap-2">
              {formation.Defender.map(player => {
                const pts = getPointsAndBonus(player.id);
                return (
                  <div key={player.id} className="bg-green-100 rounded px-3 py-2 font-bold text-green-900 shadow flex flex-col items-center">
                    {player.web_name} <span className="text-xs text-gray-500">(DEF)</span>
                    {pts && (
                      <span className="text-xs text-green-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Midfielders */}
            <div className="flex justify-center mb-2 gap-2">
              {formation.Midfielder.map(player => {
                const pts = getPointsAndBonus(player.id);
                return (
                  <div key={player.id} className="bg-yellow-100 rounded px-3 py-2 font-bold text-yellow-900 shadow flex flex-col items-center">
                    {player.web_name} <span className="text-xs text-gray-500">(MID)</span>
                    {pts && (
                      <span className="text-xs text-yellow-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Forwards */}
            <div className="flex justify-center gap-2">
              {formation.Forward.map(player => {
                const pts = getPointsAndBonus(player.id);
                return (
                  <div key={player.id} className="bg-red-100 rounded px-3 py-2 font-bold text-red-900 shadow flex flex-col items-center">
                    {player.web_name} <span className="text-xs text-gray-500">(FWD)</span>
                    {pts && (
                      <span className="text-xs text-red-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Bench Section */}
          {bench.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-center text-gray-700 mb-2">Bench</h3>
              <div className="flex flex-row flex-wrap justify-center gap-2">
                {bench.map(player => {
                  const pts = getPointsAndBonus(player.id);
                  return (
                    <div key={player.id} className="bg-gray-200 rounded px-3 py-2 font-bold text-gray-700 shadow flex flex-col items-center">
                      <span>{player.web_name}</span>
                      <span className="text-xs text-gray-500">{POSITION_MAP[player.element_type]}</span>
                      {pts && (
                        <span className="text-xs text-gray-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyTeam;
