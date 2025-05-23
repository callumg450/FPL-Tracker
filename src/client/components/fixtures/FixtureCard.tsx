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
      className="bg-white rounded-xl p-4 sm:p-6 cursor-pointer shadow-md hover:shadow-lg
                transition-all duration-300 border border-indigo-100 hover:border-indigo-300
                group"
    >
      {/* Match Time - Always at top */}
      <div className="text-center mb-4">
        <span className="text-xs sm:text-sm text-gray-600 font-mono">
          {fixture.kickoff_time ? 
            new Date(fixture.kickoff_time).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'TBD'}
        </span>
      </div>
      
      {/* Teams and Forms */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 sm:justify-between">
        {/* Home Team */}
        <div className="w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
            <img
              src={getTeamLogo(fixture.team_h)}
              alt={getTeam(fixture.team_h)?.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform duration-300"
            />
            <span className="text-indigo-900 font-medium text-sm sm:text-base">
              {getTeam(fixture.team_h)?.name}
            </span>
          </div>
          {/* Home Team Form */}
          <div className="flex items-center gap-1 justify-center sm:justify-start mt-2">
            {getTeamLastResults(fixture.team_h, allFixtures, fixture.id, 3).map((res, idx) => (
              <span
                key={idx}
                className={
                  'w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded font-bold text-xs sm:text-sm ' +
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
        
        {/* VS */}
        <div className="px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-indigo-50 text-indigo-600 font-medium text-sm">
          VS
        </div>
        
        {/* Away Team */}
        <div className="w-full sm:w-auto">
          <div className="flex flex-col-reverse sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-center sm:text-right">
            <span className="text-indigo-900 font-medium text-sm sm:text-base">
              {getTeam(fixture.team_a)?.name}
            </span>
            <img
              src={getTeamLogo(fixture.team_a)}
              alt={getTeam(fixture.team_a)?.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          {/* Away Team Form */}
          <div className="flex items-center gap-1 justify-center sm:justify-end mt-2">
            {getTeamLastResults(fixture.team_a, allFixtures, fixture.id, 3).map((res, idx) => (
              <span
                key={idx}
                className={
                  'w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded font-bold text-xs sm:text-sm ' +
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
      </div>
    </div>
  );
};

export default FixtureCard;
