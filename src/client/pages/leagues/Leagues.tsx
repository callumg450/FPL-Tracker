import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LeagueList from './LeagueList';
import LeagueStandings from './LeagueStandings';

const Leagues: React.FC = () => {
  return (
    <Routes>
      <Route index element={<LeagueList />} />
      <Route path=":leagueId" element={<LeagueStandings />} />
    </Routes>
  );
};

export default Leagues;
