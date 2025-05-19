import React, { useEffect, useState } from 'react';
import { useFplData } from '../contexts/FplDataContext.jsx';
import { set } from '../../server/proxy/cache.cjs';

interface Team {
  id: number;
  code: number;
  name: string;
  short_name: string;
}
interface Event {
  id: number;
  name: string;
  is_current: boolean;
  is_next: boolean;
}
interface Fixture {
  id: number;
  team_h: number;
  team_a: number;
  kickoff_time?: string;
  team_h_difficulty: number;
  team_a_difficulty: number;
  event: number;
}
interface Player {
  id: number;
  web_name: string;
  total_points: number;
  element_type: number;
  team: number;
}

const TeamSelector: React.FunctionComponent = () => {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextGameweek, setNextGameweek] = useState<number | null>(null);
  const { teams, players, events, allFixtures } = useFplData() as {
    teams: Team[];
    players: Player[];
    allFixtures: Fixture[];
    events: Event[];
    };

  useEffect(() => {
      setLoading(true);
      if(!allFixtures) return;
      setFixtures(allFixtures);
      // Find next gameweek
      const nextEvent = events.find((e: any) => e.is_next);
      setNextGameweek(nextEvent ? nextEvent.id : null);
      setLoading(false);
  }, [allFixtures]);

  // Get fixtures for the next gameweek
  const nextGWFixtures = fixtures.filter((f: any) => f.event === nextGameweek);

  // Calculate fixture difficulty for each team
  const teamFixtureDifficulty: { [teamId: number]: number } = {};
  nextGWFixtures.forEach((fixture: any) => {
    // Use difficulty from fixture (team_h_difficulty/team_a_difficulty)
    teamFixtureDifficulty[fixture.team_h] = fixture.team_h_difficulty;
    teamFixtureDifficulty[fixture.team_a] = fixture.team_a_difficulty;
  });

  // Sort teams by easiest fixture (lowest difficulty)
  const sortedTeams = teams
    .filter((t: any) => teamFixtureDifficulty[t.id] !== undefined)
    .sort((a: any, b: any) => teamFixtureDifficulty[a.id] - teamFixtureDifficulty[b.id]);

  // Suggest top 5 players from each of the top 5 easiest teams
  const getSuggestedPlayers = (teamId: number) =>
    players
      .filter((p: any) => p.team === teamId && p.element_type !== 5)
      .sort((a: any, b: any) => b.total_points - a.total_points)
      .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">Team Selector: Easiest Fixtures Next GW</h1>
      {loading ? (
        <div className="text-center text-lg">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : nextGameweek === null ? (
        <div className="text-center text-gray-500">No upcoming gameweek found.</div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4 text-indigo-700 text-center">Next Gameweek: GW{nextGameweek}</h2>
          <div className="space-y-8">
            {sortedTeams.slice(0, 5).map((team: any) => (
              <div key={team.id} className="bg-indigo-50 rounded-lg p-4 shadow">
                <div className="flex items-center gap-3 mb-2">
                  <img src={`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`} alt={team.name} className="w-8 h-8 rounded-full bg-gray-200" />
                  <span className="text-lg font-bold text-indigo-800">{team.name}</span>
                  <span className="ml-2 text-sm text-gray-600">Fixture Difficulty: <span className="font-semibold">{teamFixtureDifficulty[team.id]}</span></span>
                </div>
                <div>
                  <div className="font-semibold mb-1 text-indigo-700">Suggested Players:</div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getSuggestedPlayers(team.id).map((player: any) => (
                      <li key={player.id} className="flex justify-between items-center bg-white rounded px-2 py-1 shadow-sm">
                        <span>{player.web_name}</span>
                        <span className="text-xs text-gray-500">{player.total_points} pts</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamSelector;
