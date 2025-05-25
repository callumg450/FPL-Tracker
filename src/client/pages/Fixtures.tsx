import { useEffect, useState, useCallback } from 'react';
import { useFplData } from '../contexts/FplDataContext.jsx';
import { useNavigate } from 'react-router-dom';
import FixturePlayersModal from '../components/fixtures/FixturePlayersModal.tsx';
import PlayerDetailModal from '../components/PlayerDetailModal.tsx';
import FixtureCard from '../components/fixtures/FixtureCard.tsx';

type Team = {
  id: number;
  code: number;
  name: string;
  short_name: string;
};
type Event = { 
  id: number; 
  name: string; 
  is_current?: boolean;
  finished: boolean;
};
type Fixture = {
  id: number;
  team_h: number;
  team_a: number;
  kickoff_time?: string;
};

const FixturesPage = () => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedGameweek, setSelectedGameweek] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [showFixturePlayersModal, setShowFixturePlayersModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const navigate = useNavigate();
  const { teams, events, allFixtures, userId, setUserId } = useFplData() as {
    teams: Team[];
    events: Event[];
    allFixtures: Fixture[];
    userId: string;
    setUserId: (id: string) => void;
  };  
  useEffect(() => {
    setLoading(true);
    if (events && events.length > 0 && allFixtures && allFixtures.length > 0) {
      let eventToUse;
      
      // First try to find the current event (live gameweek)
      const currentEvent = events.find((e: Event) => e.is_current);
      
      // If there's a current event, use it
      if (currentEvent && !currentEvent.finished) {
        eventToUse = currentEvent;
      } else {
        // Get today's date for comparison
        const today = new Date();
        
        // Find the next upcoming gameweek by looking at fixtures
        const upcomingEvents = events
          .filter(event => {
            // Find fixtures in this event
            const eventFixtures = allFixtures.filter(f => {
              // This assumes each fixture has an event_id property
              // If not, we need to find another way to associate fixtures with events
              return (f as any).event === event.id;
            });
            
            // Check if any fixture in this event is in the future
            return eventFixtures.some(f => 
              f.kickoff_time && new Date(f.kickoff_time) > today
            );
          })
          .sort((a, b) => a.id - b.id); // Sort by ID to get the earliest upcoming event
        
        if (upcomingEvents.length > 0) {
          // Use the next upcoming gameweek
          eventToUse = upcomingEvents[0];
        } else {
          // No upcoming events, use the last gameweek of the season
          const sortedEvents = [...events].sort((a, b) => b.id - a.id);
          eventToUse = sortedEvents[0]; // Get the last gameweek
        }
      }
      
      setSelectedGameweek(eventToUse ? eventToUse.id : 1);
      
      // Filter fixtures for the selected gameweek
      const filteredFixtures = allFixtures.filter(f => 
        (f as any).event === (eventToUse?.id || 1)
      );
      
      if (filteredFixtures.length > 0) {
        setFixtures(filteredFixtures);
      } else {
        setFixtures(allFixtures);
      }
    }
    setLoading(false);
  }, [events, allFixtures]);

  // Fetch fixtures for selected gameweek
  useEffect(() => {
    if (!selectedGameweek) return;
    setLoading(true);
    setError(null);
    const fetchFixtures = async () => {
      try {
        const fixturesRes = await fetch(`${import.meta.env.VITE_BASE_URL}/fixtures?event=${selectedGameweek}`);
        const fixturesData = await fixturesRes.json();
        setFixtures(fixturesData);
      } catch (err) {
        setError('Failed to load fixtures.');
      } finally {
        setLoading(false);
      }
    };
    fetchFixtures();
  }, [selectedGameweek]);

  // Helper functions
  const getTeam = useCallback((id: number) => teams.find((t) => t.id === id), [teams]);
  const getTeamLogo = useCallback((id: number) => {
    const team = getTeam(id);
    return team ? `https://resources.premierleague.com/premierleague/badges/70/t${team.code}.png` : '';
  }, [getTeam]);
  const getTeamLastResults = useCallback((teamId: number, allFixtures: Fixture[], currentFixtureId: number, n = 3) => {
    const played = allFixtures
      .filter(
        (f) =>
          f.id !== currentFixtureId &&
          (f.team_h === teamId || f.team_a === teamId) &&
          (f as any).finished === true &&
          typeof (f as any).team_h_score === 'number' &&
          typeof (f as any).team_a_score === 'number'
      )
      .sort((a, b) => new Date((b as any).kickoff_time).getTime() - new Date((a as any).kickoff_time).getTime())
      .slice(0, n);
    return played.map((f) => {
      const isHome = f.team_h === teamId;
      const goalsFor = isHome ? (f as any).team_h_score : (f as any).team_a_score;
      const goalsAgainst = isHome ? (f as any).team_a_score : (f as any).team_h_score;
      if (goalsFor > goalsAgainst) return 'W';
      if (goalsFor < goalsAgainst) return 'L';
      return 'D';
    }).reverse();
  }, []);

  // Modal open handler (override previous)
  const handleFixtureClick = (fixture: Fixture) => {
    setSelectedFixture(fixture);
    setShowFixturePlayersModal(true);
  };

  // Handle FPL ID submission
  const handleFplIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      navigate('/my-team');
      setError(null);
    } catch (err) {
      setError('Invalid FPL ID. Please try again.');
    }
  };

  // Render UI
  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <h1 className="text-4xl font-extrabold text-center mb-4 text-indigo-800 drop-shadow-lg tracking-tight">
        FPL Tracker
        
      </h1>

      {/* FPL ID Input */}
      <div className="max-w-md mx-auto mb-8">
        <form onSubmit={handleFplIdSubmit} className="flex flex-col items-center gap-4">
          <div className="w-full">
            <div className="relative">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your FPL ID"
                className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg 
                         focus:outline-none focus:border-indigo-500 
                         text-indigo-900 placeholder-indigo-300"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2
                         px-4 py-1 bg-indigo-600 text-white rounded-md
                         hover:bg-indigo-700 transition-colors
                         text-sm font-medium"
              >
                Go 🚀
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
        </form>
      </div>
      
      {loading ? (
        <div className="text-center text-xl text-indigo-600 animate-pulse">Loading fixtures...</div>
      ) : error ? (
        <div className="text-center text-red-500 font-semibold">{error}</div>
      ) : fixtures.length === 0 ? (
        <div className="text-center text-gray-500">No fixtures for this gameweek.</div>
      ) : (
      <>
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="bg-white rounded-full px-6 py-3 shadow-md border border-indigo-100 inline-flex items-center gap-4 hover:shadow-lg transition-shadow">
            <label className="font-semibold text-lg text-indigo-700" htmlFor="gameweek-select">
              Gameweek:
            </label>
            <select
              id="gameweek-select"
              className="border-0 text-lg focus:outline-none focus:ring-0 text-indigo-600 font-medium bg-transparent"
              value={selectedGameweek ?? ''}
              onChange={e => setSelectedGameweek(Number(e.target.value))}
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {fixtures.map((fixture) => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              getTeam={getTeam}
              getTeamLogo={getTeamLogo}
              getTeamLastResults={getTeamLastResults}
              allFixtures={allFixtures}
              onClick={handleFixtureClick}
            />
          ))}
        </div>
      </>
      )}
      {/* FixturePlayersModal and PlayerDetailModal */}
      <FixturePlayersModal
        open={showFixturePlayersModal}
        fixture={selectedFixture}
        setOpen={setShowFixturePlayersModal}
        setSelectedPlayer={setSelectedPlayer}
      />
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
};

export default FixturesPage;
