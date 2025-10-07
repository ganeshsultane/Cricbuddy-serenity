// script.js - Local Cricket League Logic

const teams = {
  Shivneri: ["Pradip (C)", "Vijay", "Hardeep", "Yuvraj", "Rahul"],
  Rajgad: ["Paresh (C)", "Ganesh", "Bapu", "Vikas", "Nilesh", "Yogesh"],
  Raigad: ["Amol (C)", "Rajat", "Jay", "Sanjay", "Thombre", "Gaurav"],
  Sinhgad: ["Dinesh (C)", "Sheth", "Pratik", "Akash", "Akshay", "Yash"],
};

let match = {
  teamA: "",
  teamB: "",
  overs: 0,
  currentInnings: 0,
  innings: [],
};

let current = {
  battingTeam: "",
  batsmen: [],
  totalRuns: 0,
  wickets: 0,
  balls: 0,
  strikerIndex: 0,
  oversPlayed: 0,
};

// Populate team dropdowns correctly
document.addEventListener("DOMContentLoaded", () => {
  const teamASelect = document.getElementById("teamA");
  const teamBSelect = document.getElementById("teamB");

  Object.keys(teams).forEach((teamName) => {
    const optionA = document.createElement("option");
    optionA.value = teamName;
    optionA.text = teamName;
    teamASelect.appendChild(optionA);

    const optionB = document.createElement("option");
    optionB.value = teamName;
    optionB.text = teamName;
    teamBSelect.appendChild(optionB);
  });
});

// Start Match
document.getElementById("startMatch").onclick = () => {
  const teamA = document.getElementById("teamA").value;
  const teamB = document.getElementById("teamB").value;
  const overs = parseInt(document.getElementById("overs").value);
  if (!teamA || !teamB) return alert("Select both teams!");
  if (teamA === teamB) return alert("Choose different teams!");

  match = { teamA, teamB, overs, currentInnings: 1, innings: [] };
  startInnings(teamA);
};

function startInnings(battingTeam) {
  current = {
    battingTeam,
    batsmen: teams[battingTeam].map((p) => ({
      name: p,
      runs: 0,
      balls: 0,
      sr: 0,
    })),
    totalRuns: 0,
    wickets: 0,
    balls: 0,
    strikerIndex: 0,
  };

  document.getElementById("setup").style.display = "none";
  document.getElementById("scoreSection").style.display = "block";
  document.getElementById("inningsTitle").innerText = `Innings ${
    match.currentInnings
  }: ${battingTeam} Batting`;
  updateDisplay();
}

function updateDisplay() {
  const oversBowled = (current.balls / 6).toFixed(1);
  const rr =
    current.balls > 0
      ? (current.totalRuns / (current.balls / 6)).toFixed(2)
      : 0;

  const batsman = current.batsmen[current.strikerIndex];
  batsman.sr =
    batsman.balls > 0 ? ((batsman.runs / batsman.balls) * 100).toFixed(2) : 0;

  document.getElementById(
    "scoreDisplay"
  ).innerHTML = `<h3>${current.totalRuns}/${current.wickets} (${oversBowled} overs)</h3>
  <p>Run Rate: ${rr}</p>`;

  document.getElementById(
    "batsmanStats"
  ).innerHTML = `<h4>Striker: ${batsman.name}</h4>
  <p>Runs: ${batsman.runs} | Balls: ${batsman.balls} | SR: ${batsman.sr}</p>`;

  // If 2nd innings -> show target info
  if (match.currentInnings === 2) {
    const target = match.innings[0].totalRuns + 1;
    const runsNeeded = target - current.totalRuns;
    const ballsRemaining = match.overs * 6 - current.balls;
    const rrr = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(2) : 0;
    document.getElementById(
      "matchInfo"
    ).innerHTML = `<p>Target: ${target}</p>
      <p>Runs needed: ${runsNeeded} off ${ballsRemaining} balls</p>
      <p>Required RR: ${rrr}</p>`;
  }
}

// Run buttons
document.querySelectorAll(".run").forEach((btn) =>
  btn.addEventListener("click", () => addRun(parseInt(btn.dataset.run)))
);
document.getElementById("wicket").onclick = wicket;
document.getElementById("nextBatsman").onclick = nextBatsman;

function addRun(runs) {
  current.totalRuns += runs;
  current.balls++;

  const batsman = current.batsmen[current.strikerIndex];
  batsman.runs += runs;
  batsman.balls++;

  checkEndConditions();
  updateDisplay();
}

function wicket() {
  current.wickets++;
  current.balls++;
  checkEndConditions();
  updateDisplay();
}

function nextBatsman() {
  if (current.strikerIndex < current.batsmen.length - 1) {
    current.strikerIndex++;
    updateDisplay();
  } else {
    alert("No more batsmen left!");
  }
}

function checkEndConditions() {
  if (current.balls >= match.overs * 6 || current.wickets >= 6) {
    endInnings();
  }

  if (match.currentInnings === 2) {
    const target = match.innings[0].totalRuns + 1;
    if (current.totalRuns >= target) {
      endMatch(`${current.battingTeam} won by ${
        match.overs * 6 - current.balls
      } balls`);
    }
  }
}

function endInnings() {
  current.oversPlayed = (current.balls / 6).toFixed(1);
  match.innings.push(current);

  if (match.currentInnings === 1) {
    match.currentInnings = 2;
    startInnings(match.teamB === current.battingTeam ? match.teamA : match.teamB);
  } else {
    const target = match.innings[0].totalRuns;
    const winner =
      current.totalRuns > target
        ? current.battingTeam
        : match.innings[0].totalRuns > current.totalRuns
        ? match.innings[0].battingTeam
        : "Match Tied";

    endMatch(winner);
  }
}

function endMatch(winner) {
  document.getElementById("matchInfo").innerHTML = `<h2>🏆 ${winner}</h2>`;
  match.winner = winner;

  // Create report
  generateMatchReport(match);
}