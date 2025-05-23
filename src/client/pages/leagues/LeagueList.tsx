import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserLeague {
  id: number;
  name: string;
  league_type: string;
  admin_entry: number;
  [key: string]: any;
}

const LeagueList: React.FC<{ userId?: string }> = ({ userId }) => {
  const [leagues, setLeagues] = useState<UserLeague[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(`${import.meta.env.VITE_BASE_URL}/user-leagues/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user leagues');
        return res.json();
      })
      .then(data => {
        const classic = data.classic || [];
        const h2h = data.h2h || [];
        setLeagues([...classic, ...h2h]);
      })
      .catch(err => setError(err.message || 'Fetch failed'))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 mt-8">
      <h2 className="text-xl font-semibold text-center mb-4">Your Leagues</h2>
      {loading ? (
        <div className="text-center text-gray-500">Loading your leagues...</div>
      ) : error ? (
        <div className="text-red-500 text-center mb-4">{error}</div>
      ) : leagues.length === 0 ? (
        <div className="text-center text-gray-500">No leagues found for this user.</div>
      ) : (
        <div className="flex flex-wrap gap-4 justify-center">
          {leagues.map(league => (
            <button
              key={league.id}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded px-4 py-3 shadow font-bold min-w-[200px] text-center border border-indigo-200"
              onClick={() => navigate(`/leagues/${league.id}`)}
            >
              <div className="text-lg">{league.name}</div>
              <div className="text-xs mt-1">{league.league_type === 'h' ? 'Head-to-Head' : 'Classic'}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueList;
