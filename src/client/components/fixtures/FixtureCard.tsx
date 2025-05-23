import { FC } from 'react';

type Team = {
  id: number;
  code: number;
  name: string;
  short_name: string;
};

type Fixture = {
  id: number;
  team_h: number;
  team_a: number;
  kickoff_time?: string;
};

interface FixtureCardProps {
  fixture: Fixture;
  getTeam: (id: number) => Team | undefined;
  getTeamLogo: (id: number) => string;
  getTeamLastResults: (teamId: number, allFixtures: Fixture[], currentFixtureId: number, n?: number) => string[];
  allFixtures: Fixture[];
  onClick: (fixture: Fixture) => void;
}

const FixtureCard: FC<FixtureCardProps> = ({
  fixture,
  getTeam,
  getTeamLogo,
  getTeamLastResults,
  allFixtures,
  onClick,
}) => {
  return (
    <div
      onClick={() => onClick(fixture)}
      className="bg-white rounded-xl p-6 cursor-pointer shadow-md hover:shadow-lg
                transition-all duration-300 border border-indigo-100 hover:border-indigo-300
                group"
    >
      <div className="flex items-center justify-between mb-4">
        {/* Home Team Form */}
        <div className="flex items-center gap-1">
          {getTeamLastResults(fixture.team_h, allFixtures, fixture.id, 3).map((res, idx) => (
            <span
              key={idx}
              className={
                'w-6 h-6 flex items-center justify-center rounded font-bold text-sm ' +
                (res === 'W' ? 'bg-green-100 text-green-600' :
                 res === 'L' ? 'bg-red-100 text-red-600' :
                 'bg-gray-100 text-gray-600')
              }
            >
              {res}
            </span>
          ))}
        </div>
        
        {/* Match Time */}
        <span className="text-sm text-gray-600 font-mono">
          {fixture.kickoff_time ? 
            new Date(fixture.kickoff_time).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'TBD'}
        </span>
        
        {/* Away Team Form */}
        <div className="flex items-center gap-1">
          {getTeamLastResults(fixture.team_a, allFixtures, fixture.id, 3).map((res, idx) => (
            <span
              key={idx}
              className={
                'w-6 h-6 flex items-center justify-center rounded font-bold text-sm ' +
                (res === 'W' ? 'bg-green-100 text-green-600' :
                 res === 'L' ? 'bg-red-100 text-red-600' :
                 'bg-gray-100 text-gray-600')
              }
            >
              {res}
            </span>
          ))}
        </div>
      </div>
      
      {/* Teams */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <img
            src={getTeamLogo(fixture.team_h)}
            alt={getTeam(fixture.team_h)?.name}
            className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
          />
          <span className="text-indigo-900 font-medium">
            {getTeam(fixture.team_h)?.name}
          </span>
        </div>
        
        <div className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 font-medium mx-4">
          VS
        </div>
        
        <div className="flex items-center gap-3 flex-1 justify-end text-right">
          <span className="text-indigo-900 font-medium">
            {getTeam(fixture.team_a)?.name}
          </span>
          <img
            src={getTeamLogo(fixture.team_a)}
            alt={getTeam(fixture.team_a)?.name}
            className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default FixtureCard;
