import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeamSelector from '../pages/TeamSelector.tsx';
import '../index.css';
import FixturesPage from '../pages/Fixtures.tsx';
import MyTeam from '../pages/MyTeam.tsx';
import Leagues from '../pages/leagues/Leagues.tsx';
import BonusPoints from '../pages/BonusPoints.tsx';
import { FplDataProvider } from '../contexts/FplDataContext.jsx';
import Layout from './layout/Layout.tsx';

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
        <Layout>
          <Routes>
            <Route path="/" element={<FixturesPage />} />              
            <Route path="/team-selector" element={<TeamSelector />} />
            <Route path="/my-team" element={<MyTeam userId={userId} />} />
            <Route path="/leagues/*" element={<Leagues userId={userId} />} />
            <Route path="/bonus-points" element={<BonusPoints />} />
          </Routes>
        </Layout>
      </Router>
    </FplDataProvider>
  );
}

export default App;