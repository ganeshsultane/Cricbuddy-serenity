// report.js - Cricket Match Report Generator using SheetJS

function generateMatchReport(matchData) {
    const wb = XLSX.utils.book_new();

    // === Innings Sheets ===
    matchData.innings.forEach((inn, index) => {
        const data = [
            ["Batting Team:", inn.battingTeam],
            ["Total Runs:", inn.totalRuns],
            ["Wickets:", inn.wickets],
            ["Overs Played:", inn.oversPlayed],
            [],
            ["Player", "Runs", "Balls", "Strike Rate"]
        ];

        inn.batsmen.forEach(b => {
            data.push([b.name, b.runs, b.balls, b.sr]);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, `Innings ${index + 1}`);
    });

    // === Summary Sheet ===
    const summary = [
        ["Match Summary"],
        ["Teams", `${matchData.teamA} vs ${matchData.teamB}`],
        ["Overs", matchData.overs],
        ["Winner", matchData.winner],
        [],
        ["Inning", "Batting Team", "Runs", "Wickets", "Overs"]
    ];

    matchData.innings.forEach((inn, i) => {
        summary.push([
            i + 1,
            inn.battingTeam,
            inn.totalRuns,
            inn.wickets,
            inn.oversPlayed
        ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // === Save File ===
    const fileName = `${matchData.teamA}_vs_${matchData.teamB}_report.xlsx`;
    XLSX.writeFile(wb, fileName);
    alert(`Match report saved as: ${fileName}`);
}