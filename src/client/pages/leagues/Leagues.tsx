import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LeagueList from './LeagueList';
import LeagueStandings from './LeagueStandings';

const Leagues: React.FC<{ userId?: string }> = ({ userId }) => {
  return (
    <Routes>
      <Route index element={<LeagueList userId={userId} />} />
      <Route path=":leagueId" element={<LeagueStandings />} />
    </Routes>
  );
};

export default Leagues;
