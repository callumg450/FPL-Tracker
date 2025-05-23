import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './layout/Layout.tsx';
import FixturesPage from '../pages/Fixtures.tsx';
import TeamSelector from '../pages/TeamSelector.tsx';
import MyTeam from '../pages/MyTeam.tsx';
import Leagues from '../pages/leagues/Leagues.tsx';
import BonusPoints from '../pages/BonusPoints.tsx';
import { FplDataProvider } from '../contexts/FplDataContext.jsx';

function App() {
  return (
    <FplDataProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<FixturesPage />} />              
            <Route path="/team-selector" element={<TeamSelector />} />
            <Route path="/my-team" element={<MyTeam />} />
            <Route path="/leagues/*" element={<Leagues />} />
            <Route path="/bonus-points" element={<BonusPoints />} />
          </Routes>
        </Layout>
      </Router>
    </FplDataProvider>
  );
}

export default App;