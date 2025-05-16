import React from 'react';

const POSITION_MAP: Record<number, string> = {
  1: 'Goalkeeper',
  2: 'Defender',
  3: 'Midfielder',
  4: 'Forward',
};

interface Player {
  id: number;
  element_type: number;
  web_name: string;
  [key: string]: any;
}
interface Pick {
  element: number;
  position: number;
  multiplier: number;
  [key: string]: any;
}
interface Team {
  code: number;
  id: number;
  name: string;
  [key: string]: any;
}
interface TeamFormationProps {
  picks: Pick[];
  players: Player[];
  liveData?: Array<{ id: number; stats: { total_points: number; bonus: number; minutes: number } }>;
  showPoints?: boolean;
  teams?: Team[];
  fixtures?: any[];
}

const TeamFormation: React.FC<TeamFormationProps> = ({ picks, players, liveData = [], showPoints = false, teams = [], fixtures = [] }) => {
  // Add state for selected player and fixture info
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
  const [fixtureInfo, setFixtureInfo] = React.useState<any | null>(null);

  // Map pick.element to player object
  const getPlayer = (elementId: number) => players.find(p => p.id === elementId);

  // Group picks by position for formation, and separate bench
  const formation: Record<string, any[]> = {
    Goalkeeper: [],
    Defender: [],
    Midfielder: [],
    Forward: [],
  };
  let bench: any[] = [];
  if (picks && players.length) {
    picks.forEach((pick: any) => {
      const player = getPlayer(pick.element);
      if (player) {
        const pos = POSITION_MAP[player.element_type];
        if (pick.position <= 11) {
          if (formation[pos]) formation[pos].push({ ...player, pick });
        } else {
          bench.push({ ...player, pick });
        }
      }
    });
  }

  // Helper to get bonus points for a player from fixtures (live bonus)
  const getLiveBonusFromFixtures = (elementId: number): number | null => {
    if (!fixtures || !fixtures.length) return null;
    for (const fixture of fixtures) {
      if (!fixture.stats) continue;
      const bonusObj = fixture.stats.find((s: any) => s.identifier === 'bonus');
      if (bonusObj) {
        const allBonus = [...(bonusObj.h || []), ...(bonusObj.a || [])];
        const found = allBonus.find((b: any) => b.element === elementId);
        if (found) return found.value;
      }
    }
    return null;
  };

  // Helper to get points and bonus for a player for the selected gameweek
  const getPointsAndBonus = (elementId: number) => {
    if (liveData && liveData.length) {
      const live = liveData.find((el: any) => el.id === elementId);
      if (live) {
        // Use live bonus from fixtures if available
        const bonus = getLiveBonusFromFixtures(elementId);
        return {
          points: live.stats.total_points,
          bonus: bonus !== null ? bonus : (live.stats.bonus > 0 ? live.stats.bonus : null),
        };
      }
      return null;
    }
    return null;
  };

  // Helper to get player face image URL
  const getPlayerFaceUrl = (player: Player) => {
    if (!player.photo) return undefined;
    // FPL photo property is like '12345.jpg', but the URL uses .png
    const code = player.photo.split('.')[0];
    return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
  };

  // Helper to get fixture info for a player in the current gameweek
  const getFixtureForPlayer = (player: Player) => {
    if (!teams || !teams.length || !player || !player.team || !fixtures.length) return null;
    return fixtures.find((f: any) => f.team_h === player.team || f.team_a === player.team);
  };

  // Handler for player click
  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    const fixture = getFixtureForPlayer(player);
    setFixtureInfo(fixture);
    if (fixture) {
      console.log('Fixture info for', player.web_name, fixture);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Goalkeeper */}
      <div className="flex justify-center mb-2">
        {formation.Goalkeeper.map(player => {
          const pts = showPoints ? getPointsAndBonus(player.id) : null;
          const faceUrl = getPlayerFaceUrl(player);
          return (
            <div key={player.id} className="bg-blue-100 rounded px-4 py-2 mx-1 font-bold text-blue-900 shadow flex flex-col items-center" onClick={() => handlePlayerClick(player)}>
              {faceUrl && <img src={faceUrl} alt={player.web_name} className="w-10 h-12 rounded mb-1" />}
              {player.web_name} <span className="text-xs text-gray-500">(GK)</span>
              {pts && (
                <span className="text-xs text-blue-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Defenders */}
      <div className="flex justify-center mb-2 gap-2">
        {formation.Defender.map(player => {
          const pts = showPoints ? getPointsAndBonus(player.id) : null;
          const faceUrl = getPlayerFaceUrl(player);
          return (
            <div key={player.id} className="bg-green-100 rounded px-3 py-2 font-bold text-green-900 shadow flex flex-col items-center" onClick={() => handlePlayerClick(player)}>
              {faceUrl && <img src={faceUrl} alt={player.web_name} className="w-10 h-12 rounded mb-1" />}
              {player.web_name} <span className="text-xs text-gray-500">(DEF)</span>
              {pts && (
                <span className="text-xs text-green-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Midfielders */}
      <div className="flex justify-center mb-2 gap-2">
        {formation.Midfielder.map(player => {
          const pts = showPoints ? getPointsAndBonus(player.id) : null;
          const faceUrl = getPlayerFaceUrl(player);
          return (
            <div key={player.id} className="bg-yellow-100 rounded px-3 py-2 font-bold text-yellow-900 shadow flex flex-col items-center" onClick={() => handlePlayerClick(player)}>
              {faceUrl && <img src={faceUrl} alt={player.web_name} className="w-10 h-12 rounded mb-1" />}
              {player.web_name} <span className="text-xs text-gray-500">(MID)</span>
              {pts && (
                <span className="text-xs text-yellow-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Forwards */}
      <div className="flex justify-center gap-2">
        {formation.Forward.map(player => {
          const pts = showPoints ? getPointsAndBonus(player.id) : null;
          const faceUrl = getPlayerFaceUrl(player);
          return (
            <div key={player.id} className="bg-red-100 rounded px-3 py-2 font-bold text-red-900 shadow flex flex-col items-center" onClick={() => handlePlayerClick(player)}>
              {faceUrl && <img src={faceUrl} alt={player.web_name} className="w-10 h-12 rounded mb-1" />}
              {player.web_name} <span className="text-xs text-gray-500">(FWD)</span>
              {pts && (
                <span className="text-xs text-red-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Bench Section */}
      {bench.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-center text-gray-700 mb-2">Bench</h3>
          <div className="flex flex-row flex-wrap justify-center gap-2">
            {bench.map(player => {
              const pts = showPoints ? getPointsAndBonus(player.id) : null;
              const faceUrl = getPlayerFaceUrl(player);
              return (
                <div key={player.id} className="bg-gray-200 rounded px-3 py-2 font-bold text-gray-700 shadow flex flex-col items-center">
                  {faceUrl && <img src={faceUrl} alt={player.web_name} className="w-10 h-12 rounded mb-1" />}
                  <span>{player.web_name}</span>
                  <span className="text-xs text-gray-500">{POSITION_MAP[player.element_type]}</span>
                  {pts && (
                    <span className="text-xs text-gray-800 font-normal">{pts.points} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Fixture Info Modal */}
      {selectedPlayer && fixtureInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative max-h-[80vh] flex flex-col">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-indigo-600 text-2xl font-bold" onClick={() => setSelectedPlayer(null)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 text-indigo-800 text-center">Fixture Info for {selectedPlayer.web_name}</h2>
            <pre className="text-xs overflow-x-auto bg-gray-100 rounded p-4 max-h-96">{JSON.stringify(fixtureInfo, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamFormation;
