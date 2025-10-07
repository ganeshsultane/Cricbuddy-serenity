// 🏏 Team data
const teams = {
  "Shivneri": ["Pradip (C)", "Vijay", "Hardeep", "Yuvraj", "Rahul"],
  "Rajgad": ["Paresh (C)", "Ganesh", "Bapu", "Vikas", "Nilesh", "Yogesh"],
  "Raigad": ["Amol (C)", "Rajat", "Jay", "Sanjay", "Thombre", "Gaurav"],
  "Sinhgad": ["Dinesh (C)", "Sheth", "Pratik", "Akash", "Akshay", "Yash"]
};

// 🔹 Elements
const team1Select = document.getElementById('team1');
const team2Select = document.getElementById('team2');
const startMatchBtn = document.getElementById('startMatch');
const scoringSection = document.getElementById('scoring');
const battingTeamName = document.getElementById('battingTeamName');
const runsEl = document.getElementById('runs');
const wicketsEl = document.getElementById('wickets');
const oversEl = document.getElementById('oversCount');
const runRateEl = document.getElementById('runRate');
const endInningsBtn = document.getElementById('endInnings');
const resultSection = document.getElementById('result');
const summaryEl = document.getElementById('summary');
const newMatchBtn = document.getElementById('newMatch');

// 🏏 State variables
let currentTeam = '';
let totalRuns = 0;
let totalWickets = 0;
let totalBalls = 0;
let oversLimit = 0;
let matchData = {};

// 🏁 Initialize dropdowns
Object.keys(teams).forEach(team => {
  let opt1 = document.createElement('option');
  opt1.value = team; opt1.textContent = team;
  team1Select.appendChild(opt1);

  let opt2 = document.createElement('option');
  opt2.value = team; opt2.textContent = team;
  team2Select.appendChild(opt2);
});

// 🎬 Start Match
startMatchBtn.onclick = () => {
  const t1 = team1Select.value;
  const t2 = team2Select.value;
  oversLimit = parseInt(document.getElementById('overs').value);

  if (t1 === t2) return alert("Teams must be different!");

  currentTeam = t1;
  matchData = { team1: t1, team2: t2, overs: oversLimit, scores: {} };

  document.getElementById('setup').style.display = 'none';
  scoringSection.style.display = 'block';
  battingTeamName.textContent = `${t1} Batting`;
};

// 🏏 Ball-by-ball scoring
document.querySelectorAll('.runBtn').forEach(btn => {
  btn.onclick = () => {
    totalRuns += parseInt(btn.dataset.run);
    updateDisplay();
  };
});

document.getElementById('wicketBtn').onclick = () => {
  totalWickets++;
  updateDisplay();
};

document.getElementById('nextBall').onclick = () => {
  totalBalls++;
  if (totalBalls >= oversLimit * 6 || totalWickets >= 6) {
    alert("Innings Over!");
  }
  updateDisplay();
};

// 🔹 Update Display
function updateDisplay() {
  runsEl.textContent = totalRuns;
  wicketsEl.textContent = totalWickets;
  oversEl.textContent = `${Math.floor(totalBalls/6)}.${totalBalls%6}`;
  runRateEl.textContent = (totalBalls ? (totalRuns / (totalBalls/6)).toFixed(2) : '0.00');
}

// 🏁 End Innings
endInningsBtn.onclick = () => {
  matchData.scores[currentTeam] = {
    runs: totalRuns,
    wickets: totalWickets,
    overs: totalBalls/6
  };

  if (currentTeam === matchData.team1) {
    // 2nd innings
    currentTeam = matchData.team2;
    battingTeamName.textContent = `${currentTeam} Batting`;
    totalRuns = totalWickets = totalBalls = 0;
    updateDisplay();
  } else {
    // Match end
    const t1 = matchData.team1;
    const t2 = matchData.team2;
    const s1 = matchData.scores[t1];
    const s2 = matchData.scores[t2];
    let winner = s1.runs > s2.runs ? t1 : (s2.runs > s1.runs ? t2 : "Tie");

    scoringSection.style.display = 'none';
    resultSection.style.display = 'block';

    summaryEl.innerHTML = `
      <p><b>${t1}:</b> ${s1.runs}/${s1.wickets} (${s1.overs.toFixed(1)} overs)</p>
      <p><b>${t2}:</b> ${s2.runs}/${s2.wickets} (${s2.overs.toFixed(1)} overs)</p>
      <h3>🏆 Winner: ${winner}</h3>
    `;

    // Save match to localStorage
    let history = JSON.parse(localStorage.getItem('cricketMatches') || '[]');
    history.push({ ...matchData, winner });
    localStorage.setItem('cricketMatches', JSON.stringify(history));
  }
};

// 🆕 New Match
newMatchBtn.onclick = () => location.reload();