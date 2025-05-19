import React, { useState, useEffect } from 'react';
import { useFplData } from '../contexts/FplDataContext.jsx';

interface BonusPointsProps {}

interface GameWeek {
  id: number;
  is_current: boolean;
}

interface Team {
  id: number;
  name: string;
  short_name: string;
  code: number;
}

interface Fixture {
  id: number;
  team_h: number;
  team_a: number;
  finished: boolean;
  stats: Array<{
    identifier: string;
    h?: Array<{ element: number; value: number }>;
    a?: Array<{ element: number; value: number }>;
  }>;
}

interface BonusPointEntry {
  element: number;
  value: number;
  bps: number | null;
  provisional: boolean;
  team?: number;
}

const BonusPoints: React.FC<BonusPointsProps> = () => {
  const { teams, players, rawBootstrapData } = useFplData() as {
    teams: Team[];
    players: { id: number; web_name: string }[];
    rawBootstrapData: any;
    };
  const [selectedGameweek, setSelectedGameweek] = useState<number | null>(null);
  const [gameweeks, setGameweeks] = useState<GameWeek[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch gameweeks on mount
  useEffect(() => {
    const gws = rawBootstrapData.events || [];
    setGameweeks(gws);
    // Set selected gameweek to current gameweek
    const currentGw = gws.find((gw: any) => gw.is_current);
    if (currentGw) {
        setSelectedGameweek(currentGw.id);
    }
  }, []);

  // Fetch fixtures when gameweek changes
  useEffect(() => {
    if (!selectedGameweek) return;
    
    setLoading(true);
    fetch(`http://localhost:5000/api/fixtures?event=${selectedGameweek}`)
      .then(res => res.json())
      .then(data => {
        console.log('Fixtures data:', data);
        setFixtures(data || []);
      })
      .catch(error => {
        console.error('Error fetching fixtures:', error);
      })
      .finally(() => setLoading(false));
  }, [selectedGameweek]);

  // Helper to get player name
  const getPlayerName = (elementId: number) => {
    const player = players.find(p => p.id === elementId);
    return player ? player.web_name : 'Unknown';
  };

  // Helper to get team name
  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown';
  };  // Helper to get bonus points from fixture
  const getBonusPoints = (fixture: Fixture): BonusPointEntry[] => {
    if (!fixture.stats) return [];
    
    // First check official bonus points
    const bonusObj = fixture.stats.find((s) => s.identifier === 'bonus');
    const bpsObj = fixture.stats.find((s) => s.identifier === 'bps');
    
    let bonusPoints: BonusPointEntry[] = [];
    
    // Handle official bonus points
    if (bonusObj && ((bonusObj.h && bonusObj.h.length > 0) || (bonusObj.a && bonusObj.a.length > 0))) {
      bonusPoints = [...(bonusObj.h || []), ...(bonusObj.a || [])]
        .sort((a, b) => b.value - a.value)
        .map(entry => ({
          ...entry,
          provisional: false,
          bps: null
        }));
    }
    
    // If no official bonus points or they're empty, use BPS
    if ((!bonusPoints.length) && bpsObj) {
      const allBps = [
        ...(bpsObj.h || []).map((entry) => ({ ...entry, team: fixture.team_h })),
        ...(bpsObj.a || []).map((entry) => ({ ...entry, team: fixture.team_a }))
      ];
      
      if (allBps.length > 0) {
        // Sort by BPS value
        allBps.sort((a, b) => b.value - a.value);
        
        // Get top 3 for provisional bonus points
        bonusPoints = allBps.slice(0, 3).map((entry, index) => ({
          element: entry.element,
          value: 3 - index,
          bps: entry.value,
          provisional: true,
          team: entry.team
        }));
      }
    }
    
    return bonusPoints;
  };
  // Helper to check if a fixture should be displayed
  const shouldDisplayFixture = (fixture: Fixture): boolean => {
    if (!fixture.stats) return false;
    
    // Check for either bonus points or BPS data
    const hasBonus = fixture.stats.some((s) => s.identifier === 'bonus');
    const hasBps = fixture.stats.some((s) => {
      if (s.identifier !== 'bps') return false;
      // Check if there are any BPS entries
      return ((s.h && s.h.length > 0) || (s.a && s.a.length > 0));
    });
    
    return hasBonus || hasBps;
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">Bonus Points</h1>
      
      {/* Gameweek Selector */}
      <div className="mb-8">
        <label htmlFor="gameweek" className="block text-sm font-medium text-gray-700 mb-2">
          Select Gameweek
        </label>
        <select
          id="gameweek"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedGameweek || ''}
          onChange={(e) => setSelectedGameweek(Number(e.target.value))}
        >
          {gameweeks.map((gw: any) => (
            <option key={gw.id} value={gw.id}>
              Gameweek {gw.id} {gw.is_current ? '(Current)' : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading fixtures...</div>
      ) : (
        <div className="space-y-6">          {fixtures.map(fixture => {
            if (!shouldDisplayFixture(fixture)) return null;
            const bonusPoints = getBonusPoints(fixture);
            // Only show fixtures that actually have bonus data
            if (!bonusPoints || bonusPoints.length === 0) return null;

            return (
              <div key={fixture.id} className="bg-white rounded-lg shadow p-6">
                {/* Fixture Header */}
                <div className="text-center mb-4">
                  <h2 className="text-lg font-semibold">
                    {getTeamName(fixture.team_h)} vs {getTeamName(fixture.team_a)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {fixture.finished ? 'Final' : 'Live (Subject to change)'}
                  </p>
                </div>

                {/* Bonus Points List */}
                <div className="space-y-2">
                  {bonusPoints.map((bp, index) => (
                    <div 
                      key={bp.element}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <div>
                        <span className="font-medium">{getPlayerName(bp.element)}</span>
                        {bp.bps && (
                          <span className="text-sm text-gray-500 ml-2">
                            (BPS: {bp.bps})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className={`font-bold ${bp.provisional ? 'text-yellow-600' : 'text-green-600'}`}>
                          {bp.value} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BonusPoints;
