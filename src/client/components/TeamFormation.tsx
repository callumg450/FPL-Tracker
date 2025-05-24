import React from 'react';
import PlayerCard from './PlayerCard';

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
  is_captain: boolean;
  is_vice_captain: boolean;
  [key: string]: any;
}
interface Team {
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
  // Helper to map pick.element to player object
  const getPlayer = (elementId: number) => players.find(p => p.id === elementId);
  // Helper to determine if player is captain or vice-captain
  const getCaptainStatus = (pick: Pick): { isCaptain: boolean; isViceCaptain: boolean } => {
    return {
      isCaptain: pick.is_captain,
      isViceCaptain: pick.is_vice_captain
    };
  };

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
  }  // Helper to get bonus points for a player from fixtures (live bonus)
  const getLiveBonusFromFixtures = (elementId: number): number | null => {
    if (!fixtures || !fixtures.length) return null;
    
    for (const fixture of fixtures) {
      // Check if player is in this fixture
      const isInFixture = fixture.stats?.some((s: any) => {
        if (s.identifier === 'bps') {
          return [...(s.h || []), ...(s.a || [])].some(p => p.element === elementId);
        }
        return false;
      });

      if (!isInFixture) continue;
      if (!fixture.stats) continue;

      // First check if official bonus points are available
      const bonusObj = fixture.stats.find((s: any) => s.identifier === 'bonus');
      if (bonusObj) {
        const allBonus = [...(bonusObj.h || []), ...(bonusObj.a || [])];
        const found = allBonus.find((b: any) => b.element === elementId);
        if (found) return found.value;
      }

      // If no official bonus, calculate from BPS
      const bpsObj = fixture.stats.find((s: any) => s.identifier === 'bps');
      if (bpsObj) {
        // Combine and sort all BPS entries
        const allBps = [
          ...(bpsObj.h || []).map((entry: any) => ({ ...entry })),
          ...(bpsObj.a || []).map((entry: any) => ({ ...entry }))
        ].sort((a, b) => b.value - a.value);

        // Assign bonus points based on BPS ranking (top 3 get 3,2,1 points)
        const bonusPoints = allBps.slice(0, 3).map((entry, index) => ({
          element: entry.element,
          bonus: 3 - index
        }));

        // Find if our player gets any bonus
        const playerBonus = bonusPoints.find(b => b.element === elementId);
        if (playerBonus) return playerBonus.bonus;
      }
    }
    return null;
  };  // Helper to get points and bonus for a player for the selected gameweek
  const getPointsAndBonus = (elementId: number) => {
    if (liveData && liveData.length) {
      const live = liveData.find((el: any) => el.id === elementId);
      if (live) {
        // Always try to get bonus points from fixtures first
        const liveBonus = getLiveBonusFromFixtures(elementId);
        // If no live bonus available, check for stored bonus in liveData
        const bonus = liveBonus !== null ? liveBonus : (live.stats.bonus || null);
        
        return {
          points: live.stats.total_points,
          bonus: bonus,
          stats: live.stats // Pass stats for breakdown
        };
      }
    }
    return null;
  };

  // Helper to generate a breakdown of points for tooltip
  const getPointsBreakdown = (stats: any, elementType?: number) => {
    if (!stats) return [];
    const breakdown: string[] = [];

    // FPL points rules (simplified, not all edge cases)
    // See: https://fantasy.premierleague.com/help/rules
    // elementType: 1 = GK, 2 = DEF, 3 = MID, 4 = FWD
    const pos = elementType;
    // Minutes played
    if (typeof stats.minutes === 'number') {
      let minPts = 0;
      if (stats.minutes >= 60) minPts = 2;
      else if (stats.minutes > 0) minPts = 1;
      breakdown.push(`${stats.minutes} minutes played: ${minPts} pts`);
    }
    // Goals scored
    if (typeof stats.goals_scored === 'number' && stats.goals_scored > 0) {
      let goalPts = 0;
      if (pos === 1) goalPts = 6;
      else if (pos === 2) goalPts = 6;
      else if (pos === 3) goalPts = 5;
      else if (pos === 4) goalPts = 4;
      breakdown.push(`${stats.goals_scored} goal(s): +${stats.goals_scored * goalPts} pts`);
    }
    // Assists
    if (typeof stats.assists === 'number' && stats.assists > 0) {
      breakdown.push(`${stats.assists} assist(s): +${stats.assists * 3} pts`);
    }
    // Clean sheet
    if (typeof stats.clean_sheets === 'number' && stats.clean_sheets > 0) {
      if (pos === 1 || pos === 2) breakdown.push(`Clean sheet: +4 pts`);
      else if (pos === 3) breakdown.push(`Clean sheet: +1 pt`);
    }
    // Goals conceded (DEF/GK lose 1 pt for every 2 goals conceded)
    if ((pos === 1 || pos === 2) && typeof stats.goals_conceded === 'number' && stats.goals_conceded > 1) {
      const lost = Math.floor(stats.goals_conceded / 2);
      if (lost > 0) breakdown.push(`${stats.goals_conceded} goals conceded: -${lost} pts`);
    }
    // Own goals
    if (typeof stats.own_goals === 'number' && stats.own_goals > 0) {
      breakdown.push(`${stats.own_goals} own goal(s): -${stats.own_goals * 2} pts`);
    }
    // Penalties saved
    if (typeof stats.penalties_saved === 'number' && stats.penalties_saved > 0) {
      breakdown.push(`${stats.penalties_saved} penalty saved: +${stats.penalties_saved * 5} pts`);
    }
    // Penalties missed
    if (typeof stats.penalties_missed === 'number' && stats.penalties_missed > 0) {
      breakdown.push(`${stats.penalties_missed} penalty missed: -${stats.penalties_missed * 2} pts`);
    }
    // Yellow cards
    if (typeof stats.yellow_cards === 'number' && stats.yellow_cards > 0) {
      breakdown.push(`${stats.yellow_cards} yellow card(s): -${stats.yellow_cards * 1} pts`);
    }
    // Red cards
    if (typeof stats.red_cards === 'number' && stats.red_cards > 0) {
      breakdown.push(`${stats.red_cards} red card(s): -${stats.red_cards * 3} pts`);
    }
    // Saves (GK only)
    if (pos === 1 && typeof stats.saves === 'number' && stats.saves > 0) {
      const savePts = Math.floor(stats.saves / 3);
      if (savePts > 0) breakdown.push(`${stats.saves} saves: +${savePts} pts`);
    }
    // Bonus
    if (typeof stats.bonus === 'number' && stats.bonus > 0) {
      breakdown.push(`Bonus: +${stats.bonus} pts`);
    }
    // Total
    if (typeof stats.total_points === 'number') breakdown.push(`Total: ${stats.total_points} pts`);
    return breakdown;
  };

  // Helper to get player face image URL
  const getPlayerFaceUrl = (player: Player) => {
    if (!player.photo) return undefined;
    // FPL photo property is like '12345.jpg', but the URL uses .png
    const code = player.photo.split('.')[0];
    return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
  };

  const [activeTooltipId, setActiveTooltipId] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActiveTooltipId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4" ref={containerRef}>
      {/* Goalkeeper */}
      <div className="flex justify-center mb-2">
        {formation.Goalkeeper.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            positionLabel="GK"
            colorClass="bg-blue-100 text-blue-900"
            pointsColorClass="text-blue-800"
            showPoints={showPoints}
            getPointsAndBonus={getPointsAndBonus}
            getPlayerFaceUrl={getPlayerFaceUrl}
            getCaptainStatus={getCaptainStatus}
            getPointsBreakdown={getPointsBreakdown}
            activeTooltipId={activeTooltipId}
            setActiveTooltipId={setActiveTooltipId}
          />
        ))}
      </div>
      {/* Defenders */}
      <div className="flex justify-center mb-2 gap-2">
        {formation.Defender.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            positionLabel="DEF"
            colorClass="bg-green-100 text-green-900"
            pointsColorClass="text-green-800"
            showPoints={showPoints}
            getPointsAndBonus={getPointsAndBonus}
            getPlayerFaceUrl={getPlayerFaceUrl}
            getCaptainStatus={getCaptainStatus}
            getPointsBreakdown={getPointsBreakdown}
            activeTooltipId={activeTooltipId}
            setActiveTooltipId={setActiveTooltipId}
          />
        ))}
      </div>
      {/* Midfielders */}
      <div className="flex justify-center mb-2 gap-2">
        {formation.Midfielder.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            positionLabel="MID"
            colorClass="bg-yellow-100 text-yellow-900"
            pointsColorClass="text-yellow-800"
            showPoints={showPoints}
            getPointsAndBonus={getPointsAndBonus}
            getPlayerFaceUrl={getPlayerFaceUrl}
            getCaptainStatus={getCaptainStatus}
            getPointsBreakdown={getPointsBreakdown}
            activeTooltipId={activeTooltipId}
            setActiveTooltipId={setActiveTooltipId}
          />
        ))}
      </div>
      {/* Forwards */}
      <div className="flex justify-center gap-2">
        {formation.Forward.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            positionLabel="FWD"
            colorClass="bg-red-100 text-red-900"
            pointsColorClass="text-red-800"
            showPoints={showPoints}
            getPointsAndBonus={getPointsAndBonus}
            getPlayerFaceUrl={getPlayerFaceUrl}
            getCaptainStatus={getCaptainStatus}
            getPointsBreakdown={getPointsBreakdown}
            activeTooltipId={activeTooltipId}
            setActiveTooltipId={setActiveTooltipId}
          />
        ))}
      </div>
      {/* Bench Section */}
      {bench.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-center text-gray-700 mb-2">Bench</h3>
          <div className="flex flex-row flex-wrap justify-center gap-2">
            {bench.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                positionLabel={POSITION_MAP[player.element_type]?.slice(0, 3).toUpperCase() || ''}
                colorClass="bg-gray-200 text-gray-700"
                pointsColorClass="text-gray-600"
                showPoints={showPoints}
                getPointsAndBonus={getPointsAndBonus}
                getPlayerFaceUrl={getPlayerFaceUrl}
                getCaptainStatus={getCaptainStatus}
                getPointsBreakdown={getPointsBreakdown}
                activeTooltipId={activeTooltipId}
                setActiveTooltipId={setActiveTooltipId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamFormation;
