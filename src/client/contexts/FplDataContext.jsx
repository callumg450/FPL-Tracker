import React, { createContext, useState, useContext, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_BASE_URL;
const FplDataContext = createContext(null);

export const FplDataProvider = ({ children }) => {
  const [bootstrapData, setBootstrapData] = useState(null);
  const [allFixtures, setAllFixtures] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(() => sessionStorage.getItem('userId') || '');

  // Persist userId to sessionStorage whenever it changes
  useEffect(() => {
    if (userId) {
      sessionStorage.setItem('userId', userId);
    } else {
      sessionStorage.removeItem('userId');
    }
  }, [userId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch bootstrap data (teams, players, events)
        const bootstrapRes = await fetch(`${API_BASE}/bootstrap-static`);
        if (!bootstrapRes.ok) throw new Error('Could not fetch bootstrap data');
        const bootstrap = await bootstrapRes.json();
        setBootstrapData(bootstrap);

        // Fetch fixtures
        const fixturesRes = await fetch(`${API_BASE}/fixtures`);
        if (!fixturesRes.ok) throw new Error('Could not fetch fixtures');
        const fixturesData = await fixturesRes.json();
        setAllFixtures(fixturesData);
        
        // Filter to only include fixtures that haven't been played yet
        const upcomingFixtures = fixturesData.filter(f => !f.finished);
        setFixtures(upcomingFixtures);
      } catch (err) {
        console.error('Error fetching FPL data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Get current gameweek
  const getCurrentGameweek = () => {
    if (!bootstrapData?.events) return null;
    const currentEvent = bootstrapData.events.find(e => e.is_current);
    const nextEvent = bootstrapData.events.find(e => e.is_next);
    return nextEvent ? nextEvent.id : (currentEvent ? currentEvent.id : null);
  };

  // Enrich players with team short names
  const enrichedPlayers = bootstrapData?.elements?.map(player => ({
    ...player,
    team_short_name: bootstrapData.teams.find(t => t.id === player.team)?.short_name || ''
  })) || [];

  return (
    <FplDataContext.Provider value={{
      loading,
      error,
      teams: bootstrapData?.teams || [],
      players: enrichedPlayers,
      events: bootstrapData?.events || [],
      fixtures, //Upcoming fixtures,
      allFixtures,
      currentGameweek: getCurrentGameweek(),
      rawBootstrapData: bootstrapData,
      userId,
      setUserId
    }}>
      {children}
    </FplDataContext.Provider>
  );
};

export const useFplData = () => {
  const context = useContext(FplDataContext);
  if (!context) {
    throw new Error('useFplData must be used within FplDataProvider');
  }
  return context;
};
