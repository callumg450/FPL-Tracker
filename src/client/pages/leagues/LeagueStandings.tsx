import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeamFormation from '../../components/team/TeamFormation.js';
import { useFplData } from '../../contexts/FplDataContext.jsx';
import LeagueEntryModal from '../../components/LeagueEntryModal.js';

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
interface Event {
  id: number;
  is_current: boolean;
  [key: string]: any;
}
interface Player {
  id: number;
  element_type: number;
  web_name: string;
  [key: string]: any;
}
interface Team {
  code: number;
  id: number;
  name: string;
  [key: string]: any;
}

const ALL_CHIPS = [
  'wildcard',
  'freehit',
  'bboost',
  '3xc',
  'manager'
];
const CHIP_LABELS: Record<string, string> = {
  wildcard: 'Wildcard',
  freehit: 'Free Hit',
  bboost: 'Bench Boost',
  '3xc': 'Triple Captain',
  manager: 'Manager'
};

const LeagueStandings: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const [standings, setStandings] = useState<LeagueEntry[]>([]);
  const [leagueName, setLeagueName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LeagueEntry | null>(null);
  const [entryPicks, setEntryPicks] = useState<any | null>(null);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [liveData, setLiveData] = useState<any[]>([]);
  const { events, players, teams, fixtures, selectedGameweek, setSelectedGameweek } = useFplData() as any;

  // Sync selectedGameweek from context to always use sessionStorage value
  useEffect(() => {
    if (!selectedGameweek && events && events.length > 0) {
      let gw: number | undefined = undefined;
      const currentEvent = events.find((e: any) => e.is_current);
      if (currentEvent) {
        gw = currentEvent.id;
      } else {
        // Fallback: use the highest event id whose deadline_time is in the past, else max id
        const today = new Date();
        const validEvents = events.filter(e => {
          if (e.deadline_time) {
            return new Date(e.deadline_time) <= today;
          }
          return true;
        });
        if (validEvents.length > 0) {
          gw = Math.max(...validEvents.map(e => e.id));
        } else {
          gw = Math.max(...events.map(e => e.id));
        }
      }
      setSelectedGameweek(gw);
    }
  }, [events, selectedGameweek, setSelectedGameweek]);

  // Fetch league info and standings
  useEffect(() => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    setStandings([]);
    setLeagueName('');
    const fetchStandings = async () => {
      try {
        let url = `${import.meta.env.VITE_BASE_URL}/leagues-classic/${leagueId}/standings/`;
        let res = await fetch(url);
        if (!res.ok) {
          url = `${import.meta.env.VITE_BASE_URL}/leagues-h2h/${leagueId}/standings/`;
          res = await fetch(url);
        }
        if (!res.ok) throw new Error('Failed to fetch league standings');
        const data = await res.json();
        let eventId = selectedGameweek;
        if (!eventId && data.league && data.league.current_event) {
          eventId = data.league.current_event;
          setSelectedGameweek(eventId);
        } else if (!eventId && events && events.length) {
          const currentEvent = events.find(e => e.is_current);
          eventId = currentEvent ? currentEvent.id : events[0].id;
          setSelectedGameweek(eventId);
        }
        if (!eventId) throw new Error('Current gameweek could not be determined');
        const liveRes = await fetch(`${import.meta.env.VITE_BASE_URL}/event/${eventId}/live/`);
        if (!liveRes.ok) throw new Error('Failed to fetch live data');
        const liveData = await liveRes.json();
        const currentEvent = events?.find((e: any) => e.id === eventId);
        const isCurrentEventFinished = currentEvent?.finished;
        const teamsWithLivePoints = await Promise.all(
          (data.standings?.results || []).map(async (entry: any) => {
            try {
              let chipsPlayed: string[] = [];
              try {
                const chipsRes = await fetch(`${import.meta.env.VITE_BASE_URL}/entry-history/${entry.entry}`);
                if (chipsRes.ok) {
                  const chipsData = await chipsRes.json();
                  chipsPlayed = (chipsData.chips || []).map((chip: any) => chip.name);
                }
              } catch {}
              const picksRes = await fetch(`${import.meta.env.VITE_BASE_URL}/user-team/${entry.entry}/${eventId}`);
              if (!picksRes.ok) return { ...entry, chipsPlayed };
              const picksData = await picksRes.json();
              if (isCurrentEventFinished) {
                return {
                  ...entry,
                  event_transfers_cost: picksData.entry_history?.event_transfers_cost || 0,
                  chipsPlayed
                };
              }
              const livePoints = calculateLivePoints(picksData.picks, liveData.elements);
              const transferCost = picksData.entry_history?.event_transfers_cost || 0;
              const eventTotal = livePoints - transferCost;
              const previousTotal =
                typeof entry.total === 'number' && typeof entry.event_total === 'number'
                  ? entry.total - entry.event_total
                  : 0;
              const totalPoints = previousTotal + eventTotal;
              return {
                ...entry,
                event_total: eventTotal,
                total: totalPoints,
                event_transfers_cost: transferCost,
                chipsPlayed
              };
            } catch {
              return { ...entry };
            }
          })
        );
        const sortedTeams = teamsWithLivePoints.sort((a, b) => b.total - a.total);
        const teamsWithUpdatedRanks = sortedTeams.map((team, index) => ({
          ...team,
          rank: index + 1
        }));
        setStandings(teamsWithUpdatedRanks);
        setLeagueName(data.league?.name || '');
      } catch (err: any) {
        setError(err.message || 'Fetch failed');
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
    // eslint-disable-next-line
  }, [leagueId, selectedGameweek, events]);

  // Calculate bonus points for a player from live fixtures
  const getLiveBonus = (elementId: number, unfinishedFixtures: any[]): number | null => {
    if (!unfinishedFixtures?.length) return null;
    for (const fixture of unfinishedFixtures) {
      const isInFixture = fixture.stats?.some((s: any) => {
        if (s.identifier === 'bps') {
          return [...(s.h || []), ...(s.a || [])].some(p => p.element === elementId);
        }
        return false;
      });
      if (!isInFixture) continue;
      const bonusObj = fixture.stats?.find((s: any) => s.identifier === 'bonus');
      if (bonusObj) {
        const allBonus = [...(bonusObj.h || []), ...(bonusObj.a || [])];
        const found = allBonus.find((b: any) => b.element === elementId);
        if (found) return found.value;
      }
      const bpsObj = fixture.stats?.find((s: any) => s.identifier === 'bps');
      if (bpsObj) {
        const allBps = [
          ...(bpsObj.h || []).map((entry: any) => ({ ...entry })),
          ...(bpsObj.a || []).map((entry: any) => ({ ...entry }))
        ].sort((a, b) => b.value - a.value);
        const bonusPoints = allBps.slice(0, 3).map((entry, index) => ({
          element: entry.element,
          bonus: 3 - index
        }));
        const playerBonus = bonusPoints.find(b => b.element === elementId);
        if (playerBonus) return playerBonus.bonus;
      }
    }
    return null;
  };

  // Calculate live points for a team's picks
  const calculateLivePoints = (picks: any[], liveData: any[]) => {
    return picks.reduce((total, pick) => {
      const playerData = liveData.find(p => p.id === pick.element);
      if (playerData) {
        let points = playerData.stats.total_points;
        const liveBonus = getLiveBonus(pick.element, fixtures.filter(f => !f.finished));
        if (liveBonus) {
          points += liveBonus;
        }
        const multiplier = pick.multiplier;
        return total + (points * multiplier);
      }
      return total;
    }, 0);
  };

  // Fetch picks for a selected entry (team) for the current gameweek
  const fetchEntryPicks = async (entry: LeagueEntry) => {
    setLoadingPicks(true);
    setEntryPicks(null);
    setSelectedEntry(entry);
    try {
      let eventId = selectedGameweek;
      if (!eventId && events && events.length) {
        const currentEvent = events.find(e => e.is_current);
        eventId = currentEvent ? currentEvent.id : events[0].id;
        setSelectedGameweek(eventId);
      }
      if (!eventId) {
        if (entry.event) {
          eventId = entry.event;
          setSelectedGameweek(eventId);
        } else {
          throw new Error('Current gameweek not found');
        }
      }
      const liveRes = await fetch(`${import.meta.env.VITE_BASE_URL}/event/${eventId}/live/`);
      if (!liveRes.ok) throw new Error('Failed to fetch live data');
      const liveDataResponse = await liveRes.json();
      setLiveData(liveDataResponse.elements || []);
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/user-team/${entry.entry}/${eventId}`);
      if (!res.ok) throw new Error('Failed to fetch team picks');
      const data = await res.json();
      setEntryPicks(data);
      setLastRefreshTime(new Date());
    } catch (err) {
      setEntryPicks({ error: err.message || 'Fetch failed' });
    } finally {
      setLoadingPicks(false);
    }
  };

  // Auto-refresh player data when modal is open
  useEffect(() => {
    if (!selectedEntry || !entryPicks) return;
    const refreshTeamInterval = setInterval(() => {
      fetchEntryPicks(selectedEntry);
    }, 30000);
    return () => clearInterval(refreshTeamInterval);
    // eslint-disable-next-line
  }, [selectedEntry]);

  // Fetch live data for the current gameweek (for player points in modal)
  useEffect(() => {
    if (!selectedGameweek) {
      return;
    }
    const fetchLiveData = () => {
      fetch(`${import.meta.env.VITE_BASE_URL}/event/${selectedGameweek}/live/`)
        .then(res => res.json())
        .then(data => setLiveData(data.elements || []))
        .catch(() => {});
    };
    fetchLiveData();
    const refreshInterval = setInterval(fetchLiveData, 60000);
    return () => clearInterval(refreshInterval);
  }, [selectedGameweek, events]);

  return (    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-2 sm:p-8 mt-8">
      <button
        className="mb-4 text-indigo-600 hover:underline font-semibold"
        onClick={() => navigate('/leagues')}
      >
        ← Back to Leagues
      </button>
      <div className="text-center text-xl font-semibold text-indigo-700 mb-4">{leagueName}</div>
      {loading ? (
        <div className="text-center text-gray-500">Loading standings...</div>
      ) : error ? (
        <div className="text-red-500 text-center mb-4">{error}</div>
      ) : (
        <>
          {standings.length > 0 && (            
            <div className="overflow-x-auto"><table className="min-w-full border text-sm"><thead><tr className="bg-indigo-100"><th className="px-1 sm:px-2 py-1 border text-xs sm:text-sm">Rank</th><th className="px-1 sm:px-2 py-1 border text-xs sm:text-sm">Team</th><th className="px-1 sm:px-2 py-1 border text-xs sm:text-sm">Manager</th><th className="px-1 sm:px-2 py-1 border text-xs sm:text-sm">GW</th><th className="px-1 sm:px-2 py-1 border text-xs sm:text-sm">Hits</th><th className="px-1 sm:px-2 py-1 border text-xs sm:text-sm">Total</th><th className="px-1 sm:px-2 py-1 border text-xs sm:text-sm">±Rank</th><th className="px-1 sm:px-2 py-1 border text-xs sm:text-sm">Chips</th></tr></thead><tbody>{standings.map(entry => (<tr key={entry.id} className="text-center hover:bg-indigo-50 cursor-pointer" onClick={() => fetchEntryPicks(entry)}><td className="border px-1 sm:px-2 py-1 text-xs sm:text-sm font-bold">{entry.rank}</td><td className="border px-1 sm:px-2 py-1 text-xs sm:text-sm">{entry.entry_name}</td><td className="border px-1 sm:px-2 py-1 text-xs sm:text-sm">{entry.player_name}</td><td className="border px-1 sm:px-2 py-1 text-xs sm:text-sm">{entry.event_total}</td><td className={`border px-1 sm:px-2 py-1 text-xs sm:text-sm ${entry.event_transfers_cost > 0 ? 'text-red-600 font-bold' : ''}`}>{entry.event_transfers_cost > 0 ? `-${entry.event_transfers_cost}` : '0'}</td><td className="border px-2 py-1">{entry.total}</td><td className="border px-2 py-1">{entry.last_rank && entry.rank ? entry.last_rank - entry.rank > 0 ? <span className="text-green-600 font-bold">+{entry.last_rank - entry.rank}</span> : entry.last_rank - entry.rank < 0 ? <span className="text-red-600 font-bold">{entry.last_rank - entry.rank}</span> : <span className="font-bold">0</span> : '-'}</td><td className="border px-2 py-1">{(() => {const chipsPlayed = Array.isArray(entry.chipsPlayed) ? entry.chipsPlayed : []; const chipsLeft = ALL_CHIPS.filter(chip => !chipsPlayed.includes(chip)); return chipsLeft.length === 0 ? <span className="text-gray-400 text-xs">None</span> : chipsLeft.map(chip => (<span key={chip} className="inline-block bg-green-100 text-green-800 rounded px-2 py-0.5 text-xs font-semibold mr-1 mb-0.5">{CHIP_LABELS[chip] || chip}</span>));})()}</td></tr>))}</tbody></table></div>
          )}
          {standings.length === 0 && !loading && leagueName && (
            <div className="text-center text-gray-500 mt-4">No standings found for this league.</div>
          )}
        </>
      )}
      {selectedEntry && (
        <LeagueEntryModal
          selectedEntry={selectedEntry}
          entryPicks={entryPicks}
          loadingPicks={loadingPicks}
          lastRefreshTime={lastRefreshTime}
          players={players}
          liveData={liveData}
          teams={teams}
          fixtures={fixtures}
          onClose={() => {
            setSelectedEntry(null);
            setEntryPicks(null);
          }}
          onRefresh={() => {
            if (selectedEntry) fetchEntryPicks(selectedEntry);
          }}
        />
      )}
    </div>
  );
};

export default LeagueStandings;
