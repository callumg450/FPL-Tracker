import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TeamSelector from './TeamSelector.tsx';
import '../index.css';
import FixturesPage from './FixturesPage.tsx';
import PlayerDetailModal from './PlayerDetailModal.tsx';
import FixturePlayersModal from './FixturePlayersModal.tsx';
import MyTeam from './MyTeam.tsx';

function App() {
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedGameweek, setSelectedGameweek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [players, setPlayers] = useState([]);
  const [inFormPlayers, setInFormPlayers] = useState({});
  const [inFormLoading, setInFormLoading] = useState(false);
  const [allFixtures, setAllFixtures] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerSummary, setPlayerSummary] = useState(null);
  const [playerSummaryLoading, setPlayerSummaryLoading] = useState(false);
  const [userId, setUserId] = useState(() => sessionStorage.getItem('userId') || '');

  let playerSummaryCache = {};

  useEffect(() => {
    const fetchBootstrap = async () => {
      try {
        const bootstrapRes = await fetch('http://localhost:5000/api/bootstrap-static');
        const bootstrapData = await bootstrapRes.json();
        setTeams(bootstrapData.teams);
        setEvents(bootstrapData.events);
        setPlayers(bootstrapData.elements);
        const currentEvent = bootstrapData.events.find((e) => e.is_current);
        setSelectedGameweek(currentEvent ? currentEvent.id : 1);
      } catch (err) {
        setError('Failed to load teams and gameweeks.');
      }
    };
    fetchBootstrap();
  }, []);

  useEffect(() => {
    const fetchAllFixtures = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/fixtures');
        const data = await res.json();
        setAllFixtures(data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchAllFixtures();
  }, []);

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

  useEffect(() => {
    if (fixtures.length > 0) {
      console.log('First fixture data:', fixtures[0]);
    }
  }, [fixtures]);

  useEffect(() => {
    if (userId) sessionStorage.setItem('userId', userId);
  }, [userId]);

  const fetchPlayerSummary = async (playerId) => {
    const res = await fetch(`http://localhost:5000/api/element-summary/${playerId}/`);
    return res.json();
  };

  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedPlayer) return;
      setPlayerSummaryLoading(true);
      try {
        const summary = await fetchPlayerSummary(selectedPlayer.id);
        console.log('Player summary:', summary);
        setPlayerSummary(summary);
      } catch {
        setPlayerSummary(null);
      } finally {
        setPlayerSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [selectedPlayer]);

  useEffect(() => {
    const getInFormPlayers = async () => {
      if (!selectedFixture || !players.length) return;
      setInFormLoading(true);
      const newInForm = {};
      for (const teamId of [selectedFixture.team_h, selectedFixture.team_a]) {
        const teamPlayers = players.filter((p) => p.team === teamId && p.element_type !== 5);
        const summaries = await Promise.all(
          teamPlayers.map(async (player) => {
            try {
              let summary = playerSummaryCache[player.id];
              if (!summary) {
                summary = await fetchPlayerSummary(player.id);
                playerSummaryCache[player.id] = summary;
              }
              const last3 = summary.history.slice(-3);
              const last3Points = last3.reduce((sum, g) => sum + g.total_points, 0);
              return { player, last3Points };
            } catch {
              return null;
            }
          })
        );
        const validSummaries = summaries.filter(Boolean);
        let best = null;
        for (const s of validSummaries) {
          if (!best || s.last3Points > best.last3Points || (s.last3Points === best.last3Points && s.player.total_points > best.player.total_points)) {
            best = s;
          }
        }
        newInForm[teamId] = best;
      }
      setInFormPlayers(newInForm);
      setInFormLoading(false);
    };
    getInFormPlayers();
  }, [selectedFixture, players]);

  const getTeam = (id) => teams.find((t) => t.id === id);

  const getTeamLogo = (id) => {
    const team = getTeam(id);
    return team ? `https://resources.premierleague.com/premierleague/badges/t${team.code}.png` : '';
  };

  const getPlayersForFixture = (fixture) => {
    if (!fixture) return [];
    return players.filter((p) => p.team === fixture.team_h || p.team === fixture.team_a);
  };

  const getTeamLastResults = (teamId, allFixtures, currentFixtureId, n = 3) => {
    const played = allFixtures
      .filter(
        (f) =>
          f.id !== currentFixtureId &&
          (f.team_h === teamId || f.team_a === teamId) &&
          f.finished === true &&
          typeof f.team_h_score === 'number' &&
          typeof f.team_a_score === 'number'
      )
      .sort((a, b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime())
      .slice(0, n);
    return played.map((f) => {
      const isHome = f.team_h === teamId;
      const goalsFor = isHome ? f.team_h_score : f.team_a_score;
      const goalsAgainst = isHome ? f.team_a_score : f.team_h_score;
      if (goalsFor > goalsAgainst) return 'W';
      if (goalsFor < goalsAgainst) return 'L';
      return 'D';
    }).reverse();
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 py-10 px-2">
        <nav className="max-w-3xl mx-auto mb-8 flex gap-6 justify-center items-center">
          <Link to="/" className="text-indigo-700 font-bold hover:underline">Fixtures</Link>
          <Link to="/team-selector" className="text-indigo-700 font-bold hover:underline">Team Selector</Link>
          <Link to="/my-team" className="text-indigo-700 font-bold hover:underline">My Team</Link>
          <input
            type="text"
            className="border rounded px-2 py-1 ml-4 w-32"
            placeholder="User Id"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            title="Enter your FPL User Id"
          />
        </nav>
        <Routes>
          <Route
            path="/"
            element={
              <FixturesPage
                fixtures={fixtures}
                teams={teams}
                events={events}
                selectedGameweek={selectedGameweek}
                setSelectedGameweek={setSelectedGameweek}
                loading={loading}
                error={error}
                selectedFixture={selectedFixture}
                setSelectedFixture={setSelectedFixture}
                inFormPlayers={inFormPlayers}
                allFixtures={allFixtures}
                getTeam={getTeam}
                getTeamLogo={getTeamLogo}
                getTeamLastResults={getTeamLastResults}
              />
            }
          />
          <Route path="/team-selector" element={<TeamSelector />} />
          <Route path="/my-team" element={<MyTeam userId={userId} />} />
        </Routes>
        <FixturePlayersModal
          selectedFixture={selectedFixture}
          setSelectedFixture={setSelectedFixture}
          inFormPlayers={inFormPlayers}
          inFormLoading={inFormLoading}
          getTeam={getTeam}
          getTeamLogo={getTeamLogo}
          getPlayersForFixture={getPlayersForFixture}
          setSelectedPlayer={setSelectedPlayer}
        />
        {selectedPlayer && (
          <PlayerDetailModal
            player={selectedPlayer}
            playerSummary={playerSummary}
            loading={playerSummaryLoading}
            onClose={() => setSelectedPlayer(null)}
            getTeam={getTeam}
          />
        )}
      </div>
    </Router>
  );
}

export default App;