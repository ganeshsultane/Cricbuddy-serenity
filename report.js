// report.js - Generate detailed Excel (SheetJS) report
// Requires: XLSX (SheetJS) to be loaded via CDN
// Function exported: generateMatchReport(reportObj)

function generateMatchReport(reportObj) {
  // reportObj shape:
  // { teamA, teamB, overs, innings: [ { battingTeam, totalRuns, wickets, oversPlayed, batsmen:[{name,runs,balls,sr}], bowlers:[{name,overs,runs,wickets}], overs:[ [events...] ], extras, partnerships } ], winner }

  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryAoA = [
    ['Match Summary'],
    ['Teams', `${reportObj.teamA} vs ${reportObj.teamB}`],
    ['Overs', reportObj.overs],
    ['Winner', reportObj.winner || ''],
    [],
    ['Inning', 'Team', 'Runs', 'Wickets', 'Overs']
  ];
  reportObj.innings.forEach((inn, idx) => {
    summaryAoA.push([ idx+1, inn.battingTeam, inn.totalRuns, inn.wickets, inn.oversPlayed ]);
  });
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoA);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Innings sheets
  reportObj.innings.forEach((inn, idx) => {
    const aoa = [];
    aoa.push(['Batting Team:', inn.battingTeam]);
    aoa.push(['Total Runs:', inn.totalRuns, 'Wickets:', inn.wickets, 'Overs:', inn.oversPlayed]);
    aoa.push([]);
    aoa.push(['Batsmen']);
    aoa.push(['Player','Runs','Balls','SR']);
    inn.batsmen.forEach(b => aoa.push([b.name, b.runs, b.balls, b.sr]));
    aoa.push([]);
    aoa.push(['Bowlers']);
    aoa.push(['Bowler','Overs','Runs','Wickets']);
    inn.bowlers.forEach(b => aoa.push([b.name, b.overs, b.runs, b.wickets]));
    aoa.push([]);
    aoa.push(['Over by Over']);
    // overs array may contain arrays of events
    if(inn.overs && inn.overs.length){
      inn.overs.forEach((ov, i) => {
        const balls = ov.map(ev => {
          const freeHitMark = ev.isFreeHit ? '(FH)' : '';
          if(ev.type==='run') return ev.runs;
          if(ev.type==='wicket') return 'W';
          if(ev.type==='extra') return `${ev.extraType[0].toUpperCase()}+${ev.runs}${freeHitMark}`;
          return `${ev.runs}${freeHitMark}`;
        }).join(' ');
        aoa.push([`Over ${i+1}`, balls]);
      });
    }
    aoa.push([]);
    aoa.push(['Partnerships']);
    if(inn.partnerships && inn.partnerships.length){
      inn.partnerships.forEach(p => aoa.push([p.players.join(' & '), p.runs]));
    } else {
      aoa.push(['—']);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, `Innings ${idx+1}`);
  });

  // Write file
  const filename = `${reportObj.teamA}_vs_${reportObj.teamB}_scorecard.xlsx`.replace(/\s+/g,'_');
  XLSX.writeFile(wb, filename);
  alert(`Report saved as ${filename}`);
}
