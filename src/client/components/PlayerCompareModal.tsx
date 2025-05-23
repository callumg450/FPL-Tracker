//Comparing two players in the Transfer Suggestion component.
import React, { useEffect, useState } from 'react';
import { useFplData } from '../contexts/FplDataContext';

interface StatRowProps {
  label: string;
  outValue: string | number;
  inValue: string | number;
}

const StatRow: React.FC<StatRowProps> = ({ label, outValue, inValue }) => {
  const isOutBetter = parseFloat(outValue as string) > parseFloat(inValue as string);
  const isInBetter = parseFloat(inValue as string) > parseFloat(outValue as string);
  return (
    <>
      <div className={`text-center ${isOutBetter ? 'text-green-600 font-semibold' : ''}`}>{outValue}</div>
      <div className="text-center text-gray-600">{label}</div>
      <div className={`text-center ${isInBetter ? 'text-green-600 font-semibold' : ''}`}>{inValue}</div>
    </>
  );
};

interface Fixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
  team_h_name?: string;
  team_a_name?: string;
}

interface Team {
  id: number;
  short_name: string;
}

interface FixtureRowProps {
  team: { team: number };
  fixtures: Fixture[];
}

const FixtureRow: React.FC<FixtureRowProps> = ({ team, fixtures }) => {
  if (!fixtures || fixtures.length === 0) return null;
  return (
    <div className="flex justify-center space-x-2">
      {fixtures.slice(0, 3).map((fixture, idx) => {
        const isHome = fixture.team_h === team.team;
        const opponent = isHome ? fixture.team_a_name : fixture.team_h_name;
        const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
        const difficultyColor =
          difficulty === 2 ? 'bg-green-100 text-green-800' :
          difficulty === 3 ? 'bg-gray-100 text-gray-800' :
          difficulty === 4 ? 'bg-red-100 text-red-800' :
          difficulty === 5 ? 'bg-red-200 text-red-900' :
          'bg-green-200 text-green-900';
        return (
          <div key={idx} className={`px-2 py-1 rounded text-xs ${difficultyColor}`}>
            {opponent} ({isHome ? 'H' : 'A'})
          </div>
        );
      })}
    </div>
  );
};

interface Player {
  id: number;
  web_name: string;
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
}

interface PlayerCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  outPlayer: Player | null;
  inPlayer: Player | null;
}

const PlayerCompareModal: React.FC<PlayerCompareModalProps> = ({ isOpen, onClose, outPlayer, inPlayer }) => {
  const { teams, fixtures, loading, error } = useFplData() as {
    fixtures: Fixture[];
    teams: Team[];
    loading: boolean;
    error: string | null;
  };
  const [playerFixtures, setPlayerFixtures] = useState<{ out: Fixture[]; in: Fixture[] }>({ out: [], in: [] });

  useEffect(() => {
    if (!isOpen || !outPlayer || !inPlayer || !fixtures) return;

    const processPlayerFixtures = (player: Player) => {
      return fixtures
        .filter(f =>
          !f.finished &&
          ((f.team_h === player.team && f.team_a !== player.team) ||
           (f.team_a === player.team && f.team_h !== player.team))
        )
        .map(f => ({
          ...f,
          team_h_name: teams.find(t => t.id === f.team_h)?.short_name || '',
          team_a_name: teams.find(t => t.id === f.team_a)?.short_name || ''
        }))
        .sort((a, b) => a.event - b.event);
    };

    setPlayerFixtures({
      out: processPlayerFixtures(outPlayer),
      in: processPlayerFixtures(inPlayer)
    });
  }, [isOpen, outPlayer, inPlayer, teams, fixtures]);

  if (!isOpen || !outPlayer || !inPlayer) return null;
  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto text-center">
        Loading FPL data...
      </div>
    </div>
  );
  if (error) return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto text-center text-red-600">
        Error loading FPL data: {error}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Player Comparison</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Headers */}
          <div className="text-center font-semibold">{outPlayer.web_name}</div>
          <div className="text-center font-bold">Stats</div>
          <div className="text-center font-semibold">{inPlayer.web_name}</div>

          {/* Basic Info */}
          <StatRow
            label="Team"
            outValue={outPlayer.team_short_name}
            inValue={inPlayer.team_short_name}
          />

          <StatRow
            label="Price"
            outValue={`£${(outPlayer.now_cost / 10).toFixed(1)}m`}
            inValue={`£${(inPlayer.now_cost / 10).toFixed(1)}m`}
          />

          {/* Performance Stats */}
          <StatRow
            label="Form"
            outValue={outPlayer.form}
            inValue={inPlayer.form}
          />

          <StatRow
            label="Total Points"
            outValue={outPlayer.total_points}
            inValue={inPlayer.total_points}
          />

          <StatRow
            label="Points/Game"
            outValue={outPlayer.points_per_game}
            inValue={inPlayer.points_per_game}
          />

          <StatRow
            label="Minutes"
            outValue={outPlayer.minutes}
            inValue={inPlayer.minutes}
          />

          <StatRow
            label="Goals"
            outValue={outPlayer.goals_scored}
            inValue={inPlayer.goals_scored}
          />

          <StatRow
            label="Assists"
            outValue={outPlayer.assists}
            inValue={inPlayer.assists}
          />

          <StatRow
            label="Clean Sheets"
            outValue={outPlayer.clean_sheets}
            inValue={inPlayer.clean_sheets}
          />

          <StatRow
            label="BPS"
            outValue={outPlayer.bps}
            inValue={inPlayer.bps}
          />
          <StatRow
            label="ICT Index"
            outValue={outPlayer.ict_index}
            inValue={inPlayer.ict_index}
          />
        </div>
        {/* Difficulty Rating Key */}
        <div className="mt-6 border-t pt-4">
          <div className="text-center text-sm text-gray-500 mb-4">
            <div className="mb-1">Difficulty Rating:</div>
            <div className="flex flex-wrap justify-center gap-1">
              <span className="bg-green-200 text-green-900 px-2 rounded text-xs">1</span>
              <span className="bg-green-100 text-green-800 px-2 rounded text-xs">2</span>
              <span className="bg-gray-100 text-gray-800 px-2 rounded text-xs">3</span>
              <span className="bg-red-100 text-red-800 px-2 rounded text-xs">4</span>
              <span className="bg-red-200 text-red-900 px-2 rounded text-xs">5</span>
            </div>
          </div>
          {/* Upcoming Fixtures */}
          <h3 className="text-lg font-semibold mb-4 text-center">Upcoming Fixtures</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-center mb-2 text-sm font-medium">{outPlayer.web_name}</div>
              <FixtureRow team={{ team: outPlayer.team }} fixtures={playerFixtures.out} />
            </div>
            <div>
              <div className="text-center mb-2 text-sm font-medium">{inPlayer.web_name}</div>
              <FixtureRow team={{ team: inPlayer.team }} fixtures={playerFixtures.in} />
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerCompareModal;
