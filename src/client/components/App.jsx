import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TeamSelector from '../pages/TeamSelector.tsx';
import '../index.css';
import FixturesPage from '../pages/Fixtures.tsx';
import MyTeam from '../pages/MyTeam.tsx';
import Leagues from '../pages/leagues/Leagues.tsx';
import BonusPoints from '../pages/BonusPoints.tsx';
import { FplDataProvider } from '../contexts/FplDataContext.jsx';

function App() {
  // Only keep userId and modal state in App
  const [userId, setUserId] = useState(() => sessionStorage.getItem('userId') || '');

  // Persist userId
  React.useEffect(() => {
    if (userId) sessionStorage.setItem('userId', userId);
  }, [userId]);

  return (
    <FplDataProvider>
      <Router>        
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 py-10 px-2">
          <nav className="max-w-6xl mx-auto mb-8 flex flex-wrap gap-3 justify-center items-center px-4">
            <Link to="/" className="text-indigo-700 font-bold hover:underline text-sm sm:text-base">Fixtures</Link>
            <Link to="/team-selector" className="text-indigo-700 font-bold hover:underline text-sm sm:text-base">Team Selector</Link>
            <Link to="/my-team" className="text-indigo-700 font-bold hover:underline text-sm sm:text-base">My Team</Link>
            <Link to="/leagues" className="text-indigo-700 font-bold hover:underline text-sm sm:text-base">Leagues</Link>
            <Link to="/bonus-points" className="text-indigo-700 font-bold hover:underline text-sm sm:text-base">Bonus Points</Link>
            <input
              type="text"
              className="border rounded px-2 py-1 w-24 sm:w-32 text-sm"
              placeholder="User Id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              title="Enter your FPL User Id"
            />
          </nav>          
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<FixturesPage />} />              
              <Route path="/team-selector" element={<TeamSelector />} />
              <Route path="/my-team" element={<MyTeam userId={userId} />} />
              <Route path="/leagues/*" element={<Leagues userId={userId} />} />
              <Route path="/bonus-points" element={<BonusPoints />} />
            </Routes>
          </div>
        </div>
      </Router>
    </FplDataProvider>
  );
}

export default App;