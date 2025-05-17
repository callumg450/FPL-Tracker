import React, { useEffect, useState } from 'react';
import { useFplData } from '../contexts/FplDataContext';

type Team = {
  id: number;
  code: number;
  name: string;
  short_name: string;
};
type Player = { id: number; team: number; element_type: number; web_name: string; total_points: number };
type Fixture = { team_h: number; team_a: number };

const FixturePlayersModal = ({
  fixture,
  open,
  setOpen,
  setSelectedPlayer
}: {
  fixture: Fixture | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  setSelectedPlayer: (player: any) => void;
}) => {
  const { players, teams, loading: fplLoading } = useFplData() as {
    players: Player[];
    teams: Team[];
    loading: boolean;
  };
  const [inFormPlayers, setInFormPlayers] = useState<any>({});
  const [inFormLoading, setInFormLoading] = useState(false);

  // Calculate in-form players for each team in the fixture
  useEffect(() => {
    if (!fixture || players.length === 0) return;
    setInFormLoading(true);
    const playerSummaryCache: Record<number, any> = {};
    const getInForm = async () => {
      const newInForm: any = {};
      for (const teamId of [fixture.team_h, fixture.team_a]) {
        const teamPlayers = players.filter((p) => p.team === teamId && p.element_type !== 5);
        const summaries = await Promise.all(
          teamPlayers.map(async (player) => {
            try {
              let summary = playerSummaryCache[player.id];
              if (!summary) {
                const res = await fetch(`http://localhost:5000/api/element-summary/${player.id}/`);
                summary = await res.json();
                playerSummaryCache[player.id] = summary;
              }
              const last3 = summary.history.slice(-3);
              const last3Points = last3.reduce((sum: number, g: any) => sum + g.total_points, 0);
              return { player, last3Points };
            } catch {
              return null;
            }
          })
        );
        const validSummaries = summaries.filter((s): s is { player: Player; last3Points: number } => !!s);
        let best: { player: Player; last3Points: number } | null = null;
        for (const s of validSummaries) {
          if (!best || s.last3Points > best.last3Points || (s.last3Points === best.last3Points && s.player.total_points > best.player.total_points)) {
            best = s;
          }
        }
        newInForm[teamId] = best;
      }
      setInFormPlayers(newInForm);
      setInFormLoading(false);
    };
    getInForm();
  }, [fixture, players]);

  const getTeam = (id: number) => teams.find((t) => t.id === id);
  const getTeamLogo = (id: number) => {
    const team = getTeam(id);
    return team ? `https://resources.premierleague.com/premierleague/badges/t${team.code}.png` : '';
  };
  const getPlayersForFixture = (fixture: Fixture) => {
    if (!fixture) return [];
    return players.filter((p) => p.team === fixture.team_h || p.team === fixture.team_a);
  };

  if (!open || !fixture) return null;
  if (fplLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative max-h-[80vh] flex flex-col items-center justify-center">
          <span className="text-indigo-600 animate-pulse text-lg">Loading FPL data...</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={e => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative max-h-[80vh] flex flex-col">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-indigo-600 text-2xl font-bold"
          onClick={() => setOpen(false)}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-indigo-800 text-center">
          Players: {getTeam(fixture.team_h)?.short_name} & {getTeam(fixture.team_a)?.short_name}
        </h2>
        {/* In-form players at the top */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {[fixture.team_h, fixture.team_a].map(teamId => (
            <div key={teamId} className="flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1">Most In-Form</span>
              {inFormLoading ? (
                <span className="text-indigo-600 animate-pulse">Loading...</span>
              ) : inFormPlayers[teamId] ? (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                  {getTeamLogo(teamId) ? (
                    <img src={getTeamLogo(teamId)} alt={getTeam(teamId)?.name} className="w-6 h-6 inline-block align-middle" />
                  ) : null}
                  <span className="font-semibold text-green-800">{inFormPlayers[teamId].player.web_name}</span>
                  <span className="text-xs text-green-700">({inFormPlayers[teamId].last3Points} pts last 3)</span>
                </div>
              ) : (
                <span className="text-gray-400">No data</span>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-y-auto flex-1" style={{ maxHeight: '40vh' }}>
          {[fixture.team_h, fixture.team_a].map(teamId => (
            <div key={teamId}>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                {getTeamLogo(teamId) ? (
                  <img src={getTeamLogo(teamId)} alt={getTeam(teamId)?.name} className="w-6 h-6 inline-block align-middle" />
                ) : null}
                {getTeam(teamId)?.name}
              </h3>
              <ul className="space-y-1">
                {getPlayersForFixture(fixture)
                  .filter((p: any) => p.team === teamId && p.element_type !== 5)
                  .sort((a: any, b: any) => b.total_points - a.total_points)
                  .map((player: any) => (
                    <li key={player.id} className="flex justify-between text-sm">
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedPlayer(player);
                        }}
                      >
                        {player.web_name}
                      </span>
                      <span className="font-mono text-indigo-700 font-semibold">{player.total_points} pts</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FixturePlayersModal;
