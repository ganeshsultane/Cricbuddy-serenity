// ========== Configuration & Teams ==========
const teams = {
  "Shivneri": ["Pradip (C)","Vijay","Hardeep","Yuvraj","Rahul","(sub)"],
  "Rajgad": ["Paresh (C)","Ganesh","Bapu","Vikas","Nilesh","Yogesh"],
  "Raigad": ["Amol (C)","Rajat","Jay","Sanjay","Thombre","Gaurav"],
  "Sinhgad": ["Dinesh (C)","Sheth","Pratik","Akash","Akshay","Yash"]
};

// DOM
const team1Select = document.getElementById('team1');
const team2Select = document.getElementById('team2');
const startMatchBtn = document.getElementById('startMatch');
const setupSection = document.getElementById('setup');
const scoringSection = document.getElementById('scoring');
const inningTitle = document.getElementById('inningTitle');
const battingTeamEl = document.getElementById('battingTeam');
const runsEl = document.getElementById('runs');
const wicketsEl = document.getElementById('wickets');
const oversCountEl = document.getElementById('oversCount');
const oversLimitDisplay = document.getElementById('oversLimitDisplay');
const runRateEl = document.getElementById('runRate');
const targetBlock = document.getElementById('targetBlock');
const targetEl = document.getElementById('target');
const runsNeededEl = document.getElementById('runsNeeded');
const ballsLeftEl = document.getElementById('ballsLeft');
const rrrEl = document.getElementById('rrr');
const batsmanTableBody = document.querySelector('#batsmanTable tbody');
const endInningsBtn = document.getElementById('endInningsBtn');
const nextBallBtn = document.getElementById('nextBallBtn');
const swapStrikeBtn = document.getElementById('swapStrikeBtn');
const wicketBtn = document.getElementById('wicketBtn');
const runBtns = document.querySelectorAll('.runBtn');

const resultSection = document.getElementById('result');
const summaryArea = document.getElementById('summaryArea');
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const newMatchBtn = document.getElementById('newMatchBtn');

const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const oversInput = document.getElementById('overs');

// State
let match = null; // will hold match metadata and scores
let currentBatting = null; // team name batting
let inningsIndex = 1; // 1 or 2
let oversLimit = 7;
let balls = 0;
let runs = 0;
let wickets = 0;
let battingOrder = []; // list of players (strings)
let batsmenStats = {}; // name -> {runs,balls}
let striker = null; // name
let nonStriker = null;
let nextBatsmanPtr = 2; // next battingOrder index to come in
let target = 0;

// ---------- initialize selects ----------
Object.keys(teams).forEach(t => {
  const o1 = document.createElement('option'); o1.value = t; o1.textContent = t; team1Select.appendChild(o1);
  const o2 = document.createElement('option'); o2.value = t; o2.textContent = t; team2Select.appendChild(o2);
});

// history
function renderHistory(){
  const history = JSON.parse(localStorage.getItem('cricketMatches') || '[]');
  if(!history.length){ historyList.innerHTML = '<div class="small-muted">No saved matches yet.</div>'; return; }
  historyList.innerHTML = history.map((m,i)=> {
    const d = m.date || '-';
    return `<div><strong>${d}</strong> — ${m.team1} ${m.scores[m.team1].runs}/${m.scores[m.team1].wickets} vs ${m.team2} ${m.scores[m.team2].runs}/${m.scores[m.team2].wickets} — <em>${m.winner}</em></div>`;
  }).join('');
}
renderHistory();
clearHistoryBtn.onclick = ()=>{ localStorage.removeItem('cricketMatches'); renderHistory(); }

// ---------- Start match ----------
startMatchBtn.onclick = () => {
  const t1 = team1Select.value;
  const t2 = team2Select.value;
  oversLimit = parseInt(oversInput.value) || 7;
  oversLimitDisplay.textContent = oversLimit;

  if(!t1 || !t2){ alert("Choose both teams"); return; }
  if(t1 === t2){ alert("Teams must be different"); return; }

  // initialize match object
  match = {
    date: new Date().toISOString().slice(0,10),
    team1: t1, team2: t2, overs: oversLimit,
    scores: {}
  };

  setupSection.style.display = 'none';
  scoringSection.style.display = 'block';

  // start 1st innings with team1 batting
  startInnings(t1);
};

// ---------- Start innings ----------
function startInnings(teamName){
  inningsIndex = inningsIndex; // keep
  currentBatting = teamName;
  balls = 0; runs = 0; wickets = 0;
  battingOrder = Array.from(teams[teamName]); // copy
  // ensure exactly 6 players — take first 6 if extra
  if(battingOrder.length > 6) battingOrder = battingOrder.slice(0,6);

  // initialize batsmen stats
  batsmenStats = {};
  battingOrder.forEach(p => batsmenStats[p] = {runs:0, balls:0});
  // set openers: first two
  striker = battingOrder[0];
  nonStriker = battingOrder[1];
  nextBatsmanPtr = 2;

  // UI
  inningTitle.textContent = `Innings ${inningsIndex}`;
  battingTeamEl.textContent = currentBatting;
  updateScoreDisplay();
  renderBatsmen();
  targetBlock.style.display = 'none';
}

// ---------- render batsmen table ----------
function renderBatsmen(){
  batsmanTableBody.innerHTML = '';
  battingOrder.forEach(name => {
    const st = batsmenStats[name];
    const sr = (st.balls>0) ? ((st.runs / st.balls)*100).toFixed(2) : '0.00';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td>
      <td>${st.runs}</td>
      <td>${st.balls}</td>
      <td>${sr}</td>
      <td>${(name===striker)?'<span class="on-strike">●</span>':''}</td>`;
    batsmanTableBody.appendChild(tr);
  });
}

// ---------- update scoreboard ----------
function updateScoreDisplay(){
  runsEl.textContent = runs;
  wicketsEl.textContent = wickets;
  const oversCompleted = Math.floor(balls/6);
  const ballsThisOver = balls % 6;
  oversCountEl.textContent = `${oversCompleted}.${ballsThisOver}`;
  runRateEl.textContent = (balls ? (runs / (balls/6)).toFixed(2) : '0.00');

  // target info (only in 2nd innings)
  if(inningsIndex === 2 && target > 0){
    targetBlock.style.display = 'block';
    targetEl.textContent = target;
    const runsNeeded = Math.max(target - runs, 0);
    const ballsLeft = Math.max((oversLimit*6) - balls, 0);
    runsNeededEl.textContent = runsNeeded;
    ballsLeftEl.textContent = ballsLeft;
    rrrEl.textContent = (ballsLeft>0 ? (runsNeeded / (ballsLeft/6)).toFixed(2) : '0.00');
  } else {
    targetBlock.style.display = 'none';
  }
}

// ---------- ball progression logic ----------
function advanceBall(){
  balls++;
  // end of over: swap strike
  if(balls % 6 === 0){
    const tmp = striker; striker = nonStriker; nonStriker = tmp;
  }
  updateScoreDisplay();
  renderBatsmen();

  // check end of innings conditions
  if(balls >= oversLimit*6 || wickets >= 6){
    alert("Innings over");
    endInnings();
  }
}

// ---------- recording runs ----------
function recordRun(r){
  // credit striker
  batsmenStats[striker].runs += r;
  batsmenStats[striker].balls += 1;
  runs += r;

  // odd runs => swap strike immediately
  if(r % 2 === 1){
    const tmp = striker; striker = nonStriker; nonStriker = tmp;
  }

  // after scoring, check chase win if 2nd innings
  renderBatsmen();
  updateScoreDisplay();

  if(inningsIndex === 2 && target > 0 && runs >= target){
    const ballsRemaining = (oversLimit*6) - balls;
    const msg = `${currentBatting} won by ${ballsRemaining} balls remaining`;
    endMatch(msg);
  }
}

// ---------- wicket ----------
function recordWicket(){
  // increase wicket count, credit ball to striker's balls
  batsmenStats[striker].balls += 1;
  wickets++;
  updateScoreDisplay();

  // next batsman comes in if available
  if(nextBatsmanPtr < battingOrder.length){
    const nextPlayer = battingOrder[nextBatsmanPtr];
    nextBatsmanPtr++;
    // new batsman replaces striker
    striker = nextPlayer;
    renderBatsmen();
  } else {
    // all out
    alert("All out — innings over");
    endInnings();
  }
}

// ---------- UI events ----------
runBtns.forEach(b => {
  b.onclick = () => {
    const r = parseInt(b.dataset.run);
    recordRun(r);
    advanceBall();
  };
});
wicketBtn.onclick = ()=>{ recordWicket(); advanceBall(); };
nextBallBtn.onclick = ()=>{ advanceBall(); };
swapStrikeBtn.onclick = ()=>{ const tmp = striker; striker = nonStriker; nonStriker = tmp; renderBatsmen(); };

// end innings button (manual)
endInningsBtn.onclick = ()=> endInnings();

// ---------- end innings ----------
function endInnings(){
  // save innings to match.scores
  match.scores[currentBatting] = { runs, wickets, overs: (balls/6).toFixed(1), batsmen: JSON.parse(JSON.stringify(batsmenStats)) };

  if(inningsIndex === 1){
    // prepare for 2nd innings
    inningsIndex = 2;
    // set target
    target = runs + 1;
    // reset scoring state and start 2nd innings with other team
    startInnings(match.team2);
    // carry target into UI
    balls = 0; runs = 0; wickets = 0;
    updateScoreDisplay();
    // show target
    targetBlock.style.display = 'block';
    targetEl.textContent = target;
  } else {
    // match finished
    endMatch();
  }
}

// ---------- end match ----------
function endMatch(customMessage){
  // ensure current innings stats saved
  match.scores[currentBatting] = { runs, wickets, overs: (balls/6).toFixed(1), batsmen: JSON.parse(JSON.stringify(batsmenStats)) };

  // determine winner
  const s1 = match.scores[match.team1];
  const s2 = match.scores[match.team2];
  let winner = 'Tie';
  if(s1 && s2){
    if(s1.runs > s2.runs) winner = match.team1;
    else if(s2.runs > s1.runs) winner = match.team2;
  } else {
    winner = customMessage || 'Incomplete';
  }
  match.winner = customMessage || winner;

  scoringSection.style.display = 'none';
  resultSection.style.display = 'block';

  // build summary display
  let html = `<div><strong>${match.team1}:</strong> ${s1 ? `${s1.runs}/${s1.wickets} (${s1.overs})` : 'N/A'}</div>`;
  html += `<div><strong>${match.team2}:</strong> ${s2 ? `${s2.runs}/${s2.wickets} (${s2.overs})` : 'N/A'}</div>`;
  html += `<h3>🏆 ${match.winner}</h3>`;

  // show batsmen tables for both innings
  function batsHtml(team){
    const s = match.scores[team];
    if(!s) return `<div><em>No innings</em></div>`;
    const rows = Object.entries(s.batsmen).map(([name,st])=>{
      const sr = (st.balls>0)?((st.runs/st.balls)*100).toFixed(2):'0.00';
      return `<tr><td>${name}</td><td>${st.runs}</td><td>${st.balls}</td><td>${sr}</td></tr>`;
    }).join('');
    return `<div><strong>${team} Batting</strong>
      <table style="width:100%;margin-top:6px;border-collapse:collapse;">
        <thead><tr><th>Name</th><th>R</th><th>B</th><th>SR</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  html += `<div style="margin-top:10px">${batsHtml(match.team1)}${batsHtml(match.team2)}</div>`;
  summaryArea.innerHTML = html;

  // save to history (localStorage)
  const history = JSON.parse(localStorage.getItem('cricketMatches') || '[]');
  history.push(match);
  localStorage.setItem('cricketMatches', JSON.stringify(history));
  renderHistory();
}

// ---------- CSV generation ----------
downloadCsvBtn.onclick = () => {
  if(!match) return alert("No match data");
  const rows = [];
  rows.push(['Match Date', match.date]);
  rows.push(['Team1', match.team1, 'Team2', match.team2, 'Overs', match.overs]);
  rows.push([]);
  rows.push(['Innings','Team','R','W','Overs']);
  // innings summaries
  const s1 = match.scores[match.team1] || {};
  const s2 = match.scores[match.team2] || {};
  rows.push(['1', match.team1, s1.runs || '', s1.wickets || '', s1.overs || '']);
  rows.push(['2', match.team2, s2.runs || '', s2.wickets || '', s2.overs || '']);
  rows.push([]);
  rows.push(['Winner', match.winner]);
  rows.push([]);
  // batsmen details
  rows.push(['Batsmen Summary']);
  rows.push(['Team','Player','Runs','Balls','SR']);
  [match.team1, match.team2].forEach(team=>{
    const s = match.scores[team];
    if(!s) return;
    Object.entries(s.batsmen).forEach(([name,st])=>{
      const sr = (st.balls>0)?((st.runs/st.balls)*100).toFixed(2):'0.00';
      rows.push([team, name, st.runs, st.balls, sr]);
    });
  });

  // convert to CSV
  const csvContent = rows.map(r => r.map(cell => `"${(cell===undefined||cell===null)?'':String(cell).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = `match_${match.date}_${match.team1}_vs_${match.team2}.csv`.replace(/\s+/g,'_');
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// new match
newMatchBtn.onclick = () => window.location.reload();