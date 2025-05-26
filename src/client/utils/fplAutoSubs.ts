// Utility to apply FPL auto-subs based on live minutes and formation rules
// Types are generic to allow use in both LeagueStandings and LeagueEntryModal
const applyAutoSubs = (picks: any[], liveData: any[], players: any[], fixtures: any[]): any[] => {
  const starting = picks.filter(p => p.position <= 11);
  const bench = picks.filter(p => p.position > 11).sort((a, b) => a.position - b.position);
  const getMinutes = (element: number) => liveData.find((p: any) => p.id === element)?.stats.minutes ?? 0;
  const getType = (element: number) => players.find(p => p.id === element)?.element_type;
  const getTeamId = (element: number) => players.find(p => p.id === element)?.team;
  const getFixtureForPlayer = (element: number) => {
    const teamId = getTeamId(element);
    return fixtures.find(f => f.team_h === teamId || f.team_a === teamId);
  };
  const isValidFormation = (team: any[]) => {
    const types = team.map(p => getType(p.element));
    const gk = types.filter(t => t === 1).length;
    const def = types.filter(t => t === 2).length;
    const mid = types.filter(t => t === 3).length;
    const fwd = types.filter(t => t === 4).length;
    return (
      gk === 1 &&
      def >= 3 &&
      mid >= 2 &&
      fwd >= 1 &&
      team.length === 11
    );
  };
  let team = [...starting];
  let usedBench: number[] = [];
  for (let i = 0; i < team.length; i++) {
    const pick = team[i];
    const minutes = getMinutes(pick.element);
    const fixture = getFixtureForPlayer(pick.element);
    if (minutes > 0 || !fixture?.finished) continue;
    for (const benchPick of bench) {
        console.log("AutoSub!", pick.element, "->", benchPick.element);
      if (usedBench.includes(benchPick.element)) continue;
      if (getMinutes(benchPick.element) === 0) continue;
      if (getType(pick.element) === 1 && getType(benchPick.element) !== 1) continue;
      if (getType(pick.element) !== 1 && getType(benchPick.element) === 1) continue;
      const newTeam = [...team];
      newTeam[i] = benchPick;
      if (isValidFormation(newTeam)) {
        team = newTeam;
        usedBench.push(benchPick.element);
        break;
      }
    }
  }
  return team;
};

export { applyAutoSubs };
