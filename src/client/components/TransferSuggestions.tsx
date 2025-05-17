// Types for FPL data context
interface FPLEvent {
  id: number;
  is_current: boolean;
  is_next: boolean;
}
interface FPLTeam {
  id: number;
  short_name: string;
}
interface FPLFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
}
interface FPLPlayer {
  id: number;
  web_name: string;
  team: number;
  team_short_name: string;
  element_type: number;
  status: string;
  form: string;
  now_cost: number;
  [key: string]: any;
}
interface Suggestion {
  out: string;
  in: string;
  reason: string;
  outForm: number;
  inForm: number;
  nextFixture: string;
}
interface TransferSuggestionsProps {
  userId: string | number | null;
}

// Extend FPLPlayer to match PlayerCompareModal's Player type
interface PlayerCompareModalPlayer extends FPLPlayer {
  total_points: number;
  points_per_game: string;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  bps: number;
  ict_index: string;
}

import { useEffect, useState } from 'react';
import PlayerCompareModal from './PlayerCompareModal.tsx';
import { useFplData } from '../contexts/FplDataContext.jsx';

const API_BASE = 'http://localhost:5000/api';

const TransferSuggestions: React.FC<TransferSuggestionsProps> = ({ userId }) => {
  // FPL context types
  const { fixtures, events, rawBootstrapData, teams, loading: fplLoading } = useFplData() as {
    fixtures: FPLFixture[];
    events: FPLEvent[];
    rawBootstrapData: any;
    teams: FPLTeam[];
    loading: boolean;
  };
  const [loading, setLoading] = useState<boolean>(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<FPLPlayer[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [comparePlayers, setComparePlayers] = useState<{ out: PlayerCompareModalPlayer | null; in: PlayerCompareModalPlayer | null }>({ out: null, in: null });

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setSuggestions([]);
      return;
    }
    // Wait for FPL data to be loaded
    if (!rawBootstrapData || !rawBootstrapData.elements || !teams || teams.length === 0) {
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

        // --- Suggestion Logic ---
        const allPlayersData: FPLPlayer[] = rawBootstrapData.elements.map((player: FPLPlayer) => ({
          ...player,
          team_short_name: teams.find((t) => t.id === player.team)?.short_name || ''
        }));
        setAllPlayers(allPlayersData);

        const userPicks = teamData.picks || [];
        const userPlayerIds = userPicks.map((p: any) => p.element);
        const userPlayers = allPlayersData.filter((p) => userPlayerIds.includes(p.id));
        const userBank = (teamData.transfers && typeof teamData.transfers.bank === 'number')
          ? teamData.transfers.bank / 10
          : 0;

        // 1. Find flagged (injured/suspended) and poor form players
        const flagged = userPlayers.filter((p) => p.status !== 'a');
        const poorForm = userPlayers.filter((p) => p.status === 'a' && parseFloat(p.form) < 2.5);

        // 2. For each, find a replacement
        const suggestions: Suggestion[] = [];

        // Get current and next gameweek info
        const currentEvent = events.find((e) => e.is_current);
        const nextEvent = events.find((e) => e.is_next);
        const gwId = nextEvent ? nextEvent.id : (currentEvent ? currentEvent.id : null);

        const finishedFixtures = fixtures.filter((f) => !f.finished);

        const getFixtureShort = (player: FPLPlayer): string => {
          const team = teams.find((t) => t.id === player.team);
          if (!team || !finishedFixtures.length) return '';
          // Find the next fixture for this team
          const fixture = finishedFixtures.find((f) =>
            f.event === gwId &&
            (f.team_h === team.id || f.team_a === team.id)
          );
          if (!fixture) return '';
          const oppId = fixture.team_h === team.id ? fixture.team_a : fixture.team_h;
          const oppTeam = teams.find((t) => t.id === oppId);
          const homeAway = fixture.team_h === team.id ? 'H' : 'A';
          return oppTeam ? `${oppTeam.short_name} (${homeAway})` : '';
        };

        const getNextFixtureDifficulty = (player: FPLPlayer): number | null => {
          const team = teams.find((t) => t.id === player.team);
          if (!team || !fixtures.length) return null;
          // Find the next fixture for this team
          const fixture = fixtures.find((f) =>
            f.event === gwId &&
            (f.team_h === team.id || f.team_a === team.id)
          );
          if (!fixture) return null;
          return fixture.team_h === team.id ? fixture.team_h_difficulty : fixture.team_a_difficulty;
        };
        const alreadyInTeam = (id: number) => userPlayerIds.includes(id);
        const suggestedReplacements = new Set<number>(); // Track suggested replacements
        const findReplacement = (outPlayer: FPLPlayer): FPLPlayer | undefined => {
          return allPlayersData
            .filter((p) => {
              const fixtureDifficulty = getNextFixtureDifficulty(p);
              return p.element_type === outPlayer.element_type &&
                p.status === 'a' &&
                !alreadyInTeam(p.id) &&
                !suggestedReplacements.has(p.id) &&
                parseFloat(p.form) > 4.0 &&
                p.now_cost <= outPlayer.now_cost + userBank * 10 &&
                fixtureDifficulty !== null &&
                fixtureDifficulty <= 3;
            })
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
            suggestedReplacements.add(replacement.id);
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
            suggestedReplacements.add(replacement.id);
          }
        }
        setSuggestions(suggestions);
      } catch (err: any) {
        console.error('Transfer suggestions error:', err);
        setError(`Failed to fetch transfer suggestions: ${err.message}`);
      }
      setLoading(false);
    };
    fetchSuggestions();
  }, [userId, rawBootstrapData, teams, events, fixtures]);

  if (fplLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative max-h-[80vh] flex flex-col items-center justify-center">
          <span className="text-indigo-600 animate-pulse text-lg">Loading FPL data...</span>
        </div>
      </div>
    );
  }
  if (!userId) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-bold mb-2">Transfer Suggestions</h2>
        <div className="text-gray-500">Enter your FPL User ID above to see transfer suggestions.</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-md p-6 mb-8 border border-indigo-100">
      <h2 className="text-xl font-bold mb-4 text-indigo-800">Transfer Suggestions</h2>
      {loading && <div className="text-gray-600">Loading suggestions...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && suggestions.length === 0 && (
        <div>No suggestions at this time.</div>
      )}
      {!loading && !error && suggestions.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {suggestions.map((s, idx) => (
            <li key={idx} className="py-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-700">OUT:</span> {s.out}
                <span className="text-xs text-gray-500 ml-1">
                  ({allPlayers.find(p => p.web_name === s.out)?.team_short_name || ''})
                </span>
                <span className="mx-1">&rarr;</span>
                <span className="font-semibold text-green-700">IN:</span> {s.in}
                <span className="text-xs text-gray-500 ml-1">
                  ({allPlayers.find(p => p.web_name === s.in)?.team_short_name || ''})
                </span>
                <div className="text-xs text-gray-500">Reason: {s.reason} | Form: {s.outForm} &rarr; {s.inForm} | Next: {s.nextFixture}</div>
              </div>
              <button
                onClick={() => {
                  const outPlayer = allPlayers.find(p => p.web_name === s.out) as PlayerCompareModalPlayer | null;
                  const inPlayer = allPlayers.find(p => p.web_name === s.in) as PlayerCompareModalPlayer | null;
                  setComparePlayers({ out: outPlayer, in: inPlayer });
                  setIsCompareOpen(true);
                }}
                className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
              >
                Compare
              </button>
            </li>
          ))}
        </ul>
      )}
      <PlayerCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        outPlayer={comparePlayers.out}
        inPlayer={comparePlayers.in}
      />
    </div>
  );
};

export default TransferSuggestions;
