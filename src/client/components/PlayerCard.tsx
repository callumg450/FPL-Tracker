//Component for the individual player card in the fantasy team
import React from 'react';

interface PlayerCardProps {
  player: any;
  positionLabel: string;
  colorClass: string;
  pointsColorClass: string;
  showPoints: boolean;
  getPointsAndBonus: (id: number) => any;
  getPlayerFaceUrl: (player: any) => string | undefined;
  getCaptainStatus: (pick: any) => { isCaptain: boolean; isViceCaptain: boolean };
  getPointsBreakdown: (stats: any, elementType?: number) => string[];
  activeTooltipId: number | null;
  setActiveTooltipId: (id: number | null) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  positionLabel,
  colorClass,
  pointsColorClass,
  showPoints,
  getPointsAndBonus,
  getPlayerFaceUrl,
  getCaptainStatus,
  getPointsBreakdown,
  activeTooltipId,
  setActiveTooltipId,
}) => {
  const pts = showPoints ? getPointsAndBonus(player.id) : null;
  const faceUrl = getPlayerFaceUrl(player);
  const { isCaptain, isViceCaptain } = getCaptainStatus(player.pick);
  const breakdown = pts ? getPointsBreakdown(pts.stats, player.element_type) : [];
  return (
    <div
      className={`${colorClass} rounded px-3 py-2 font-bold shadow flex flex-col items-center relative group`}
      tabIndex={0}
      onClick={() => setActiveTooltipId(activeTooltipId === player.id ? null : player.id)}
      onTouchEnd={e => { e.stopPropagation(); setActiveTooltipId(activeTooltipId === player.id ? null : player.id); }}
    >
      {isCaptain && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-bold text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          C
        </div>
      )}
      {isViceCaptain && (
        <div className="absolute -top-2 -right-2 bg-gray-400 text-xs font-bold text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          VC
        </div>
      )}
      {faceUrl && <img src={faceUrl} alt={player.web_name} className="w-10 h-12 rounded mb-1" />}
      {player.web_name} <span className="text-xs text-gray-500">({positionLabel})</span>
      {pts && (
        <span className={`text-xs ${pointsColorClass} font-normal`}>
          {pts.points * player.pick.multiplier} pts{pts.bonus ? `, Bonus: ${pts.bonus}` : ''}
        </span>
      )}
      {/* Tooltip */}
      {showPoints && breakdown.length > 0 && (
        <div
          className={`
            absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20
            bg-white border border-gray-300 rounded shadow-lg p-2 text-xs text-gray-800 min-w-[180px] whitespace-pre-line
            hidden group-hover:block
            ${activeTooltipId === player.id ? '!block' : ''}
          `}
          style={{ pointerEvents: 'auto' }}
        >
          {breakdown.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
