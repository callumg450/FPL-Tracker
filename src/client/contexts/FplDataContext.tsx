import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Type definitions for FPL data
export interface Team {
  id: number;
  code: number;
  name: string;
  short_name: string;
  [key: string]: any;
}

export interface Player {
  id: number;
  web_name: string;
  element_type: number;
  team: number;
  team_short_name: string;
  now_cost: number;
  form: string;
  total_points: number;
  points_per_game: string;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  bps: number;
  ict_index: string;
  [key: string]: any;
}

export interface Event {
  id: number;
  is_current: boolean;
  is_next: boolean;
  [key: string]: any;
}

export interface Fixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
  team_h_name?: string;
  team_a_name?: string;
  [key: string]: any;
}

interface BootstrapData {
  teams: Team[];
  elements: Player[];
  events: Event[];
  [key: string]: any;
}

interface FplDataContextType {
  loading: boolean;
  error: string | null;
  teams: Team[];
  players: Player[];
  events: Event[];
  fixtures: Fixture[];
  currentGameweek: number | null;
  rawBootstrapData: BootstrapData | null;
}

const API_BASE = 'http://localhost:5000/api';
const FplDataContext = createContext<FplDataContextType | null>(null);

export const FplDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bootstrapData, setBootstrapData] = useState<BootstrapData | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        if (fixturesRes.ok) {
          const allFixtures = await fixturesRes.json();
          // Filter to only include fixtures that haven't been played yet
          const upcomingFixtures = allFixtures.filter((f: Fixture) => !f.finished);
          setFixtures(upcomingFixtures);
        }
      } catch (err: any) {
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
    const currentEvent = bootstrapData.events.find((e: Event) => e.is_current);
    const nextEvent = bootstrapData.events.find((e: Event) => e.is_next);
    return nextEvent ? nextEvent.id : (currentEvent ? currentEvent.id : null);
  };

  // Enrich players with team short names
  const enrichedPlayers: Player[] = bootstrapData?.elements?.map((player: Player) => ({
    ...player,
    team_short_name: bootstrapData.teams.find((t: Team) => t.id === player.team)?.short_name || ''
  })) || [];

  return (
    <FplDataContext.Provider value={{
      loading,
      error,
      teams: bootstrapData?.teams || [],
      players: enrichedPlayers,
      events: bootstrapData?.events || [],
      fixtures,
      currentGameweek: getCurrentGameweek(),
      rawBootstrapData: bootstrapData
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
