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
  // New: bench status for sub on/off badge
  benchStatus?: { cameOn?: boolean; cameOff?: boolean };
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
  benchStatus
}) => {
  const pts = showPoints ? getPointsAndBonus(player.id) : null;
  const faceUrl = getPlayerFaceUrl(player);
  const { isCaptain, isViceCaptain } = getCaptainStatus(player.pick);
  const breakdown = pts ? getPointsBreakdown(pts.stats, player.element_type) : [];
  return (
    <div
      className={`${colorClass} rounded px-2 py-1 md:px-3 md:py-2 font-bold shadow flex flex-col items-center relative group text-sm md:text-base`}
      tabIndex={0}
      onClick={() => setActiveTooltipId(activeTooltipId === player.id ? null : player.id)}
      onTouchEnd={e => { e.stopPropagation(); setActiveTooltipId(activeTooltipId === player.id ? null : player.id); }}
    >
      {/* Captain/VC badges */}
      {isCaptain && (
        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-yellow-400 text-[10px] md:text-xs font-bold text-white rounded-full w-4 h-4 md:w-6 md:h-6 flex items-center justify-center shadow-md">
          C
        </div>
      )}
      {isViceCaptain && (
        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-gray-400 text-[10px] md:text-xs font-bold text-white rounded-full w-4 h-4 md:w-6 md:h-6 flex items-center justify-center shadow-md">
          VC
        </div>
      )}
      {/* Sub on/off badge */}
      {benchStatus?.cameOn && (
        <div className="absolute -top-1 -left-1 md:-top-2 md:-left-2 bg-green-500 text-white text-[10px] md:text-xs font-bold rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center shadow-md z-10">
          ON
        </div>
      )}
      {benchStatus?.cameOff && (
        <div className="absolute -top-1 -left-1 md:-top-2 md:-left-2 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center shadow-md z-10">
          OFF
        </div>
      )}
      {faceUrl && <img src={faceUrl} alt={player.web_name} className="w-8 h-10 md:w-10 md:h-12 rounded mb-0.5 md:mb-1" />}
      <span className="text-xs md:text-sm">{player.web_name}</span>
      <span className="text-[10px] md:text-xs text-gray-500">({positionLabel})</span>
      {pts && (
        <span className={`text-[10px] md:text-xs ${pointsColorClass} font-normal`}>
          {pts.points * (player.pick.position > 11 ? 1 : player.pick.multiplier)} pts{pts.bonus ? `, +${pts.bonus}` : ''}
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
