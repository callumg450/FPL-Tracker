import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TeamSelector from '../pages/TeamSelector.tsx';
import '../index.css';
import FixturesPage from '../pages/FixturesPage.tsx';
import PlayerDetailModal from './PlayerDetailModal.tsx';
import FixturePlayersModal from './FixturePlayersModal.tsx';
import MyTeam from '../pages/MyTeam.tsx';

function App() {
  // Only keep userId and modal state in App
  const [userId, setUserId] = useState(() => sessionStorage.getItem('userId') || '');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [fixtureModal, setFixtureModal] = useState({ open: false, fixture: null });

  // Persist userId
  React.useEffect(() => {
    if (userId) sessionStorage.setItem('userId', userId);
  }, [userId]);

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
                setSelectedPlayer={setSelectedPlayer}
                setFixtureModal={setFixtureModal}
              />
            }
          />
          <Route path="/team-selector" element={<TeamSelector />} />
          <Route path="/my-team" element={<MyTeam userId={userId} />} />
        </Routes>
        {/* Fixture modal and player modal are controlled by App, but data/logic is in children */}
        <FixturePlayersModal
          open={fixtureModal.open}
          fixture={fixtureModal.fixture}
          setOpen={(open) => setFixtureModal(f => ({ ...f, open }))}
          setSelectedPlayer={setSelectedPlayer}
        />
        {selectedPlayer && (
          <PlayerDetailModal
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </div>
    </Router>
  );
}

export default App;