import React from 'react';

const FixturesPage = (props: any) => {
  // Destructure all props needed from App
  const {
    fixtures,
    teams,
    events,
    selectedGameweek,
    setSelectedGameweek,
    loading,
    error,
    selectedFixture,
    setSelectedFixture,
    inFormPlayers,
    allFixtures,
    getTeam,
    getTeamLogo,
    getTeamLastResults
  } = props;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-indigo-800 drop-shadow-lg tracking-tight">
        FPL Fixtures
      </h1>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <label className="font-semibold text-lg text-indigo-700" htmlFor="gameweek-select">
          Select Gameweek:
        </label>
        <select
          id="gameweek-select"
          className="border-2 border-indigo-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          value={selectedGameweek ?? ''}
          onChange={e => setSelectedGameweek(Number(e.target.value))}
        >
          {events.map((event: any) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-center text-xl text-indigo-600 animate-pulse">Loading fixtures...</div>
      ) : error ? (
        <div className="text-center text-red-500 font-semibold">{error}</div>
      ) : fixtures.length === 0 ? (
        <div className="text-center text-gray-500">No fixtures for this gameweek.</div>
      ) : (
        <ul className="divide-y divide-indigo-100">
          {fixtures.map((fixture: any) => (
            <li
              key={fixture.id}
              className="py-5 flex flex-col sm:flex-row items-center justify-between gap-2 cursor-pointer hover:bg-indigo-50 transition"
              onClick={() => setSelectedFixture(fixture)}
            >
              <span className="font-bold text-indigo-700 text-lg flex-1 text-center flex items-center justify-center gap-2">
                {/* Last results for home team (outside) */}
                <span className="flex items-center justify-center w-12 gap-1 mr-2">
                  {getTeamLastResults(fixture.team_h, allFixtures, fixture.id, 3).map((res: string, idx: number) => (
                    <span
                      key={idx}
                      className={
                        res === 'W' ? 'text-green-600 font-bold' :
                        res === 'L' ? 'text-red-500 font-bold' :
                        'text-gray-500 font-bold'
                      }
                    >
                      {res}
                    </span>
                  ))}
                </span>
                <img
                  src={getTeamLogo(fixture.team_h)}
                  alt={getTeam(fixture.team_h)?.name}
                  className={
                    getTeam(fixture.team_h)?.name === 'Liverpool'
                      ? 'w-8 h-8 inline-block align-middle rounded-full bg-gray-200 ml-2'
                      : 'w-8 h-8 inline-block align-middle rounded-full ml-2'
                  }
                />
                {getTeam(fixture.team_h)?.short_name}
                {inFormPlayers[fixture.id]?.[fixture.team_h] && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    In-form: {inFormPlayers[fixture.id][fixture.team_h].web_name}
                  </span>
                )}
                <span className="text-gray-400 font-normal mx-2">vs</span>
                {getTeam(fixture.team_a)?.short_name}
                {inFormPlayers[fixture.id]?.[fixture.team_a] && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    In-form: {inFormPlayers[fixture.id][fixture.team_a].web_name}
                  </span>
                )}
                <img
                  src={getTeamLogo(fixture.team_a)}
                  alt={getTeam(fixture.team_a)?.name}
                  className={
                    getTeam(fixture.team_a)?.name === 'Liverpool'
                      ? 'w-8 h-8 inline-block align-middle rounded-full bg-gray-200 mr-2'
                      : 'w-8 h-8 inline-block align-middle rounded-full mr-2'
                  }
                />
                {/* Last results for away team (outside) */}
                <span className="flex items-center justify-center w-12 gap-1 ml-2">
                  {getTeamLastResults(fixture.team_a, allFixtures, fixture.id, 3).map((res: string, idx: number) => (
                    <span
                      key={idx}
                      className={
                        res === 'W' ? 'text-green-600 font-bold' :
                        res === 'L' ? 'text-red-500 font-bold' :
                        'text-gray-500 font-bold'
                      }
                    >
                      {res}
                    </span>
                  ))}
                </span>
              </span>
              <span className="text-sm text-gray-600 font-mono flex-1 text-center">
                {fixture.kickoff_time ? new Date(fixture.kickoff_time).toLocaleString() : 'TBD'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FixturesPage;
