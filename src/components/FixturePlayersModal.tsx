import React from 'react';

const FixturePlayersModal = ({
  selectedFixture,
  setSelectedFixture,
  inFormPlayers,
  inFormLoading,
  getTeam,
  getTeamLogo,
  getPlayersForFixture,
  setSelectedPlayer
}: {
  selectedFixture: any;
  setSelectedFixture: (fixture: any) => void;
  inFormPlayers: any;
  inFormLoading: boolean;
  getTeam: (id: number) => any;
  getTeamLogo: (id: number) => string;
  getPlayersForFixture: (fixture: any) => any[];
  setSelectedPlayer: (player: any) => void;
}) => {
  if (!selectedFixture) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={e => {
        if (e.target === e.currentTarget) setSelectedFixture(null);
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative max-h-[80vh] flex flex-col">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-indigo-600 text-2xl font-bold"
          onClick={() => setSelectedFixture(null)}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-indigo-800 text-center">
          Players: {getTeam(selectedFixture.team_h)?.short_name} & {getTeam(selectedFixture.team_a)?.short_name}
        </h2>
        {/* In-form players at the top */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {[selectedFixture.team_h, selectedFixture.team_a].map(teamId => (
            <div key={teamId} className="flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1">Most In-Form</span>
              {inFormLoading ? (
                <span className="text-indigo-600 animate-pulse">Loading...</span>
              ) : inFormPlayers[teamId] ? (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                  <img src={getTeamLogo(teamId)} alt={getTeam(teamId)?.name} className="w-6 h-6 inline-block align-middle" />
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
          {[selectedFixture.team_h, selectedFixture.team_a].map(teamId => (
            <div key={teamId}>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <img src={getTeamLogo(teamId)} alt={getTeam(teamId)?.name} className="w-6 h-6 inline-block align-middle" />
                {getTeam(teamId)?.name}
              </h3>
              <ul className="space-y-1">
                {getPlayersForFixture(selectedFixture)
                  .filter((p: any) => p.team === teamId && p.element_type !== 5)
                  .sort((a: any, b: any) => b.total_points - a.total_points)
                  .map((player: any) => {
                    if (player.web_name && player.web_name.includes('Iraola')) {
                      console.log('Player info:', player);
                    }
                    return (
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
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FixturePlayersModal;
