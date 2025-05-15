import React from 'react';

const PlayerDetailModal = ({
  player,
  playerSummary,
  loading,
  onClose,
  getTeam
}: {
  player: any;
  playerSummary: any;
  loading: boolean;
  onClose: () => void;
  getTeam: (id: number) => any;
}) => {
  if (!player) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full relative max-h-[90vh] flex flex-col overflow-y-auto">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-indigo-600 text-2xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2 text-indigo-800 text-center">{player.web_name}</h2>
        <div className="flex flex-col sm:flex-row gap-6 mb-4 justify-center items-center">
          <div>
            <div className="font-semibold">Team:</div>
            <div>{getTeam(player.team)?.name}</div>
          </div>
          <div>
            <div className="font-semibold">Position:</div>
            <div>{
              player.element_type === 1 ? 'Goalkeeper' :
              player.element_type === 2 ? 'Defender' :
              player.element_type === 3 ? 'Midfielder' :
              player.element_type === 4 ? 'Forward' :
              'Other'
            }</div>
          </div>
          <div>
            <div className="font-semibold">Price:</div>
            <div>£{(player.now_cost / 10).toFixed(1)}m</div>
          </div>
          <div>
            <div className="font-semibold">Ownership:</div>
            <div>{player.selected_by_percent}%</div>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-indigo-600 animate-pulse">Loading player details...</div>
        ) : playerSummary ? (
          <>
            <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="font-semibold">Total Points</div>
                <div>{player.total_points}</div>
              </div>
              <div>
                <div className="font-semibold">Goals</div>
                <div>{player.goals_scored}</div>
              </div>
              <div>
                <div className="font-semibold">Assists</div>
                <div>{player.assists}</div>
              </div>
              <div>
                <div className="font-semibold">Clean Sheets</div>
                <div>{player.clean_sheets}</div>
              </div>
              <div>
                <div className="font-semibold">Minutes</div>
                <div>{player.minutes}</div>
              </div>
              <div>
                <div className="font-semibold">Yellow Cards</div>
                <div>{player.yellow_cards}</div>
              </div>
              <div>
                <div className="font-semibold">Red Cards</div>
                <div>{player.red_cards}</div>
              </div>
              <div>
                <div className="font-semibold">Price Change</div>
                <div>{player.cost_change_start / 10 >= 0 ? '+' : ''}{(player.cost_change_start / 10).toFixed(1)}m</div>
              </div>
            </div>
            <div>
              <div className="font-semibold mb-2">Recent Gameweek History</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr className="bg-indigo-100">
                      <th className="px-2 py-1 border">GW</th>
                      <th className="px-2 py-1 border">Points</th>
                      <th className="px-2 py-1 border">Minutes</th>
                      <th className="px-2 py-1 border">Goals</th>
                      <th className="px-2 py-1 border">Assists</th>
                      <th className="px-2 py-1 border">CS</th>
                      <th className="px-2 py-1 border">YC</th>
                      <th className="px-2 py-1 border">RC</th>
                      <th className="px-2 py-1 border">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerSummary.history.slice(-10).reverse().map((gw: any) => (
                      <tr key={gw.round}>
                        <td className="px-2 py-1 border">{gw.round}</td>
                        <td className="px-2 py-1 border">{gw.total_points}</td>
                        <td className="px-2 py-1 border">{gw.minutes}</td>
                        <td className="px-2 py-1 border">{gw.goals_scored}</td>
                        <td className="px-2 py-1 border">{gw.assists}</td>
                        <td className="px-2 py-1 border">{gw.clean_sheets}</td>
                        <td className="px-2 py-1 border">{gw.yellow_cards}</td>
                        <td className="px-2 py-1 border">{gw.red_cards}</td>
                        <td className="px-2 py-1 border">£{(gw.value / 10).toFixed(1)}m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-red-500">No player data found.</div>
        )}
      </div>
    </div>
  );
};

export default PlayerDetailModal;
