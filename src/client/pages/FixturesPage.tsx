import { useEffect, useState, useCallback } from 'react';
import { useFplData } from '../contexts/FplDataContext.jsx';

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

const FixturesPage = ({ setFixtureModal }: { setFixtureModal: (f: any) => void }) => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedGameweek, setSelectedGameweek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const { teams, events, allFixtures } = useFplData() as {
    teams: Team[];
    events: Event[];
    allFixtures: Fixture[];
    };  useEffect(() => {
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
        const fixturesRes = await fetch(`http://localhost:5000/api/fixtures?event=${selectedGameweek}`);
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
    return team ? `https://resources.premierleague.com/premierleague/badges/t${team.code}.png` : '';
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

  // Modal open handler
  const handleFixtureClick = (fixture: Fixture) => {
    setSelectedFixture(fixture);
    setFixtureModal({ open: true, fixture });
  };

  // Pass all required props to FixturePlayersModal via App
  useEffect(() => {
    if (setFixtureModal) {
      setFixtureModal((prev: any) => ({ ...prev, fixture: selectedFixture }));
    }
  }, [selectedFixture, setFixtureModal]);

  // Render UI
  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-indigo-800 drop-shadow-lg tracking-tight">
        FPL Fixtures
      </h1>
      
      {loading ? (
        <div className="text-center text-xl text-indigo-600 animate-pulse">Loading fixtures...</div>
      ) : error ? (
        <div className="text-center text-red-500 font-semibold">{error}</div>
      ) : fixtures.length === 0 ? (
        <div className="text-center text-gray-500">No fixtures for this gameweek.</div>
      ) : (
      <>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <label className="font-semibold text-lg text-indigo-700" htmlFor="gameweek-select">
            Select Gameweek:
          </label>
          <select
            id="gameweek-select"
            className="border-2 border-indigo-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
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
        <ul className="divide-y divide-indigo-100">
          {fixtures.map((fixture) => (
            <li
              key={fixture.id}
              className="py-5 flex flex-col sm:flex-row items-center justify-between gap-2 cursor-pointer hover:bg-indigo-50 transition"
              onClick={() => handleFixtureClick(fixture)}
            >
              <span className="font-bold text-indigo-700 text-lg flex-1 text-center flex items-center justify-center gap-2">
                {/* Last results for home team (outside) */}
                <span className="flex items-center justify-center w-12 gap-1 mr-2">
                  {getTeamLastResults(fixture.team_h, allFixtures, fixture.id, 3).map((res, idx) => (
                    <span
                      key={idx}
                      className={
                        res === 'W' ? 'text-green-600 font-bold' :
                        res === 'L' ? 'text-red-500 font-bold' :
                        'text-gray-500 font-bold'
                      }
                    >
                      {res}
                    </span>
                  ))}
                </span>
                <img
                  src={getTeamLogo(fixture.team_h)}
                  alt={getTeam(fixture.team_h)?.name}
                  className={
                    getTeam(fixture.team_h)?.name === 'Liverpool'
                      ? 'w-8 h-8 inline-block align-middle rounded-full bg-gray-200 ml-2'
                      : 'w-8 h-8 inline-block align-middle rounded-full ml-2'
                  }
                />
                {getTeam(fixture.team_h)?.short_name}
                <span className="text-gray-400 font-normal mx-2">vs</span>
                {getTeam(fixture.team_a)?.short_name}
                <img
                  src={getTeamLogo(fixture.team_a)}
                  alt={getTeam(fixture.team_a)?.name}
                  className={
                    getTeam(fixture.team_a)?.name === 'Liverpool'
                      ? 'w-8 h-8 inline-block align-middle rounded-full bg-gray-200 mr-2'
                      : 'w-8 h-8 inline-block align-middle rounded-full mr-2'
                  }
                />
                {/* Last results for away team (outside) */}
                <span className="flex items-center justify-center w-12 gap-1 ml-2">
                  {getTeamLastResults(fixture.team_a, allFixtures, fixture.id, 3).map((res, idx) => (
                    <span
                      key={idx}
                      className={
                        res === 'W' ? 'text-green-600 font-bold' :
                        res === 'L' ? 'text-red-500 font-bold' :
                        'text-gray-500 font-bold'
                      }
                    >
                      {res}
                    </span>
                  ))}
                </span>
              </span>
              <span className="text-sm text-gray-600 font-mono flex-1 text-center">
                {fixture.kickoff_time ? new Date(fixture.kickoff_time).toLocaleString() : 'TBD'}
              </span>
            </li>
          ))}
        </ul>
      </>
      )}
    </div>
  );
};

export default FixturesPage;
