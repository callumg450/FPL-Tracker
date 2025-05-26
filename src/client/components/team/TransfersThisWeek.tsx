import React, { useEffect, useState } from 'react';

interface Transfer {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  event: number;
}

interface Player {
  id: number;
  web_name: string;
}

interface TransfersThisWeekProps {
  entryId: number;
  eventId: number;
  players: Player[];
  eventTransfersCost?: number;
  baseUrl: string;
}

const TransfersThisWeek: React.FC<TransfersThisWeekProps> = ({
  entryId,
  eventId,
  players,
  eventTransfersCost = 0,
  baseUrl
}) => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entryId || !eventId) return;
    setLoading(true);
    fetch(`${baseUrl}/entry-transfers/${entryId}`)
      .then(res => res.json())
      .then((data) => {
        const filtered = Array.isArray(data)
          ? data.filter((t: any) => t.event === eventId)
          : [];
        setTransfers(filtered);
      })
      .catch(() => setTransfers([]))
      .finally(() => setLoading(false));
  }, [entryId, eventId, baseUrl]);

  const getPlayerName = (id: number) => {
    const player = players.find(p => p.id === id);
    return player ? player.web_name : `ID:${id}`;
  };

  return (
    <div className="mb-4">
      <div className="font-semibold text-sm text-indigo-700 mb-1">Transfers this week:</div>
      {loading ? (
        <div className="text-xs text-gray-500">Loading transfers...</div>
      ) : transfers.length === 0 ? (
        <span className="text-xs text-gray-500">No transfers made</span>
      ) : (
        <>
          <ul className="text-xs text-gray-800 mb-1">
            {transfers.map((t, i) => (
              <li key={i}>
                <span className="font-semibold text-red-700">{getPlayerName(t.element_out)}</span>
                {' -> '}
                <span className="font-semibold text-green-700">{getPlayerName(t.element_in)}</span>
              </li>
            ))}
          </ul>
          {eventTransfersCost > 0 && (
            <div className="text-xs text-red-500 font-bold">
              -{eventTransfersCost} pts hit for extra transfers
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransfersThisWeek;
