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
  teams?: Team[]; // Add teams prop for kit images
}

const TeamFormation: React.FC<TeamFormationProps> = ({ picks, players, liveData = [], showPoints = false, teams = [] }) => {
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

  // Helper to get points and bonus for a player for the selected gameweek
  const getPointsAndBonus = (elementId: number) => {
    if (liveData && liveData.length) {
      const live = liveData.find((el: any) => el.id === elementId);
      if (live) {
        return {
          points: live.stats.total_points,
          bonus: live.stats.bonus > 0 ? live.stats.bonus : null,
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

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Goalkeeper */}
      <div className="flex justify-center mb-2">
        {formation.Goalkeeper.map(player => {
          const pts = showPoints ? getPointsAndBonus(player.id) : null;
          const faceUrl = getPlayerFaceUrl(player);
          return (
            <div key={player.id} className="bg-blue-100 rounded px-4 py-2 mx-1 font-bold text-blue-900 shadow flex flex-col items-center">
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
            <div key={player.id} className="bg-green-100 rounded px-3 py-2 font-bold text-green-900 shadow flex flex-col items-center">
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
            <div key={player.id} className="bg-yellow-100 rounded px-3 py-2 font-bold text-yellow-900 shadow flex flex-col items-center">
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
            <div key={player.id} className="bg-red-100 rounded px-3 py-2 font-bold text-red-900 shadow flex flex-col items-center">
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
    </div>
  );
};

export default TeamFormation;
