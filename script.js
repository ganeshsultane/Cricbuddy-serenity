/* script.js - Enhanced match manager
   Preserves existing match/current structure and extends:
   - bowlers, extras, partnerships, over-by-over events
   - UI binds for bowler/batsman selection, chart, commentary
   - save/load to localStorage, download JSON/Excel
*/

// -------------------- Teams (6 players each) --------------------
const teams = {
  Shivneri: ["Pradip (C)", "Vijay", "Hardeep", "Yuvraj", "Rahul", "(sub)"],
  Rajgad: ["Paresh (C)", "Ganesh", "Bapu", "Vikas", "Nilesh", "Yogesh"],
  Raigad: ["Amol (C)", "Rajat", "Jay", "Sanjay", "Thombre", "Gaurav"],
  Sinhgad: ["Dinesh (C)", "Sheth", "Pratik", "Akash", "Akshay", "Yash"]
};

// -------------------- Match & Current state (preserved names) --------------------
let match = {
  teamA: "", teamB: "", overs: 7, currentInnings: 0, innings: []
};

let current = {
  battingTeam: "",
  batsmen: [],     // array of {name, runs, balls, out (bool)}
  bowlers: {},     // map name -> {legalBalls, runsConceded, wickets}
  striker: null,
  nonStriker: null,
  currentBowler: null,
  totalRuns: 0,
  wickets: 0,
  legalBalls: 0,   // counts legal deliveries only
  extras: { wide:0, noball:0, bye:0, legbye:0 },
  oversData: [],   // array of overs, each over is array of events
  partnershipRuns: 0, // current partnership runs
  partnerships: [], // list of {players:[a,b], runs}
  fallOfWickets: [], // list of {wickets, runs, over}
  isFreeHit: false // flag for free hit
};

// -------------------- DOM elements --------------------
const teamASelect = document.getElementById('teamA');
const teamBSelect = document.getElementById('teamB');
const startBtn = document.getElementById('startMatch');
const loadSavedBtn = document.getElementById('loadSaved');
const resetBtn = document.getElementById('resetMatch');

const scorePanel = document.getElementById('scorePanel');
const inningsTitle = document.getElementById('inningsTitle');
const battingTeamEl = document.getElementById('battingTeam');
const scoreLine = document.getElementById('scoreLine');
const oversLine = document.getElementById('oversLine');
const runRateEl = document.getElementById('runRate');
const targetBlock = document.getElementById('targetBlock');
const targetEl = document.getElementById('target');
const runsNeededEl = document.getElementById('runsNeeded');
const ballsLeftEl = document.getElementById('ballsLeft');
const rrrEl = document.getElementById('rrr');

const strikerSelect = document.getElementById('strikerSelect');
const nonStrikerSelect = document.getElementById('nonStrikerSelect');
const bowlerSelect = document.getElementById('bowlerSelect');
const overProgress = document.getElementById('overProgress');

const batsmanTableBody = document.querySelector('#batsmanTable tbody');
const bowlerTableBody = document.querySelector('#bowlerTable tbody');
const partnershipEl = document.getElementById('partnership');
const extrasDisplay = document.getElementById('extrasDisplay');
const extrasBreakdown = document.getElementById('extrasBreakdown');

const runBtns = document.querySelectorAll('.runBtn');
const wicketBtn = document.getElementById('wicketBtn');
const swapStrikeBtn = document.getElementById('swapStrike');
const wideBtn = document.getElementById('wideBtn');
const noBallBtn = document.getElementById('noBallBtn');
const byeBtn = document.getElementById('byeBtn');
const legByeBtn = document.getElementById('legByeBtn');
const nextBallBtn = document.getElementById('nextBall');
const endInningsBtn = document.getElementById('endInnings');

const saveBtn = document.getElementById('saveBtn');
const downloadJsonBtn = document.getElementById('downloadJson');
const downloadExcelBtn = document.getElementById('downloadExcel');

const oversList = document.getElementById('oversList');
const partnershipsList = document.getElementById('partnershipsList');
const commentaryDiv = document.getElementById('commentary');

const summaryPanel = document.getElementById('summaryPanel');
const summaryContent = document.getElementById('summaryContent');
const newMatchBtn = document.getElementById('newMatch');
const fowList = document.getElementById('fowList');

// -------------------- Utility helpers --------------------
function safeInt(v){ const n = parseInt(v); return isNaN(n) ? 0 : n; }
function formatOvers(legalBalls) { return `${Math.floor(legalBalls/6)}.${legalBalls%6}`; }
function econFrom(bowler) {
  const overs = (bowler.legalBalls/6);
  return overs > 0 ? (bowler.runsConceded / overs).toFixed(2) : '0.00';
}

// commentary generator (small)
function genCommentary(event){
  // event: {type:'run'|'wicket'|'extra', runs, player, bowler}
  const runPhrases = ["driven to cover","pulled to deep mid","slashed over point","flat-batted through the covers","smashed over long-on"];
  const wicketPhrases = ["bowled him!","caught at mid-off!","lbw given!","clean bowled!","caught behind!"];
  let text = '';
  if(event.type==='run'){
    text = `${event.player} ${runPhrases[Math.floor(Math.random()*runPhrases.length)]} - ${event.runs} run(s).`;
  } else if(event.type==='wicket'){
    text = `${event.bowler} ${wicketPhrases[Math.floor(Math.random()*wicketPhrases.length)]} ${event.player} out.`;
  } else if(event.type==='extra'){
    text = `${event.bowler} conceded ${event.runs} ${event.extraType}.`;
  }
  // append
  commentaryDiv.innerText = `${new Date().toLocaleTimeString()} — ${text}`;
}

// -------------------- Populate team selects on DOM ready --------------------
document.addEventListener('DOMContentLoaded', () => {
  Object.keys(teams).forEach(team => {
    const o1 = document.createElement('option'); o1.value = team; o1.text = team; teamASelect.appendChild(o1);
    const o2 = document.createElement('option'); o2.value = team; o2.text = team; teamBSelect.appendChild(o2);
  });

  // Load saved match if any
  startBtn.addEventListener('click', () => {
    const a = teamASelect.value, b = teamBSelect.value, overs = safeInt(document.getElementById('overs').value);
    if(!a || !b) return alert('Select both teams');
    if(a === b) return alert('Teams must be different');
    match = { teamA:a, teamB:b, overs:overs, currentInnings:1, innings:[] };
    startInnings(a);
  });

  loadSavedBtn.addEventListener('click', loadSavedMatch);
  resetBtn.addEventListener('click', () => { if(confirm('Reset match and clear saved?')) { localStorage.removeItem('cricketMatchInProgress'); location.reload(); }});
});

// -------------------- Start Innings --------------------
function startInnings(teamName){
  // Reset current state for innings
  current = {
    battingTeam: teamName,
    batsmen: teams[teamName].slice(0,6).map(p => ({ name:p, runs:0, balls:0, out:false })),
    bowlers: {}, // will fill as bowlers are used
    striker: teams[teamName][0],
    nonStriker: teams[teamName][1] || teams[teamName][0],
    currentBowler: null,
    totalRuns: 0,
    wickets: 0,
    legalBalls: 0,
    extras: { wide:0, noball:0, bye:0, legbye:0 },
    oversData: [],
    partnershipRuns: 0, // current partnership runs
    partnerships: [],
    fallOfWickets: [],
    isFreeHit: false
  };

  // UI
  scorePanel.style.display = 'block';
  summaryPanel.style.display = 'none';
  inningsTitle.innerText = `Innings ${match.currentInnings}`;
  battingTeamEl.innerText = teamName;
  updateSelects();
  renderAll();
  // chart reset for innings
  saveState(); // auto-save
}

// -------------------- update selects for striker/non-striker/bowler --------------------
function updateSelects(){
  // striker / non-striker selects
  strikerSelect.innerHTML = '';
  nonStrikerSelect.innerHTML = '';
  bowlerSelect.innerHTML = '';
  current.batsmen.forEach(b => {
    const o = document.createElement('option'); o.value = b.name; o.text = b.name;
    const o2 = o.cloneNode(true);
    strikerSelect.appendChild(o);
    nonStrikerSelect.appendChild(o2);
  });

  // default selected
  strikerSelect.value = current.striker;
  nonStrikerSelect.value = current.nonStriker;

  // bowlers list: choose from bowling team (other team)
  const bowlingTeam = (current.battingTeam === match.teamA) ? match.teamB : match.teamA;
  teams[bowlingTeam].slice(0,6).forEach(p => {
    const o = document.createElement('option'); o.value = p; o.text = p;
    bowlerSelect.appendChild(o);
  });
  // set currentBowler if exists
  bowlerSelect.value = current.currentBowler || bowlerSelect.options[0].value;
  current.currentBowler = bowlerSelect.value;
}

// -------------------- render UI pieces --------------------
function renderAll(){
  renderScore();
  renderBatsmen();
  renderBowlers();
  renderOverProgress();
  renderPartnerships();
  renderExtras();
  renderFallOfWickets();
}

function renderScore(){
  scoreLine.innerText = `${current.totalRuns}/${current.wickets}`;
  oversLine.innerText = `${formatOvers(current.legalBalls)} / ${match.overs} overs`;
  const rr = (current.legalBalls>0) ? (current.totalRuns / (current.legalBalls/6)).toFixed(2) : '0.00';
  runRateEl.innerText = rr;

  document.getElementById('freeHitIndicator').style.display = current.isFreeHit ? 'inline' : 'none';
  // second innings target block
  if(match.currentInnings === 2 && match.innings[0]){
    const target = match.innings[0].totalRuns + 1;
    const runsNeeded = Math.max(target - current.totalRuns, 0);
    const ballsLeft = Math.max(match.overs*6 - current.legalBalls, 0);
    const rrr = (ballsLeft>0) ? (runsNeeded / (ballsLeft/6)).toFixed(2) : '0.00';
    targetBlock.style.display = 'inline';
    targetEl.innerText = target;
    runsNeededEl.innerText = runsNeeded;
    ballsLeftEl.innerText = ballsLeft;
    rrrEl.innerText = rrr;
  } else {
    targetBlock.style.display = 'none';
  }
}

function renderBatsmen(){
  batsmanTableBody.innerHTML = '';
  current.batsmen.forEach(b => {
    const tr = document.createElement('tr');
    const sr = (b.balls>0) ? ((b.runs / b.balls)*100).toFixed(2) : '0.00';
    const status = b.out ? 'out' : (b.name === current.striker ? '● on strike' : (b.name === current.nonStriker ? '•' : 'not out'));
    tr.innerHTML = `<td>${b.name}</td><td>${b.runs}</td><td>${b.balls}</td><td>${sr}</td><td>${status}</td>`;
    // clicking a row sets that batsman as striker (quick selection)
    tr.addEventListener('click', () => {
      if(!b.out){
        current.striker = b.name;
        strikerSelect.value = b.name;
        renderAll();
      }
    });
    if(b.name === current.striker) tr.classList.add('on-strike');
    batsmanTableBody.appendChild(tr);
  });
}

function renderBowlers(){
  bowlerTableBody.innerHTML = '';
  Object.entries(current.bowlers).forEach(([name, st]) => {
    const oversStr = `${Math.floor(st.legalBalls/6)}.${st.legalBalls%6}`;
    const econ = econFrom(st);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}${name===current.currentBowler ? ' <span class="current-bowler">✦</span>':''}</td><td>${oversStr}</td><td>${st.runsConceded}</td><td>${st.wickets}</td><td>${econ}</td>`;
    bowlerTableBody.appendChild(tr);
  });
}

function renderOverProgress(){
  overProgress.innerHTML = '';
  const lastOver = current.oversData[current.oversData.length - 1] || [];
  lastOver.forEach(ev => {
    const span = document.createElement('span');
    span.className = 'over-ball ' + (ev.legal ? 'legal' : 'extra') + (ev.isFreeHit ? ' free-hit-ball' : '');
    const text = ev.type === 'run' ? ev.runs : (ev.type === 'wicket' ? 'W' : ev.type);
    span.textContent = text;
    span.title = `${ev.type} ${ev.runs || ''} ${ev.player ? 'by ' + ev.player : ''}`;
    overProgress.appendChild(span);
  });
}

function renderPartnerships(){
  partnershipEl.innerText = `${current.partnershipRuns} (${current.striker} & ${current.nonStriker})`;
  partnershipsList.innerHTML = current.partnerships.map(p => `${p.players.join(' & ')} — ${p.runs}`).join('<br>') || '<em>—</em>';
}

function renderExtras(){
  const totalExtras = Object.values(current.extras).reduce((a,b)=>a+b,0);
  extrasDisplay.innerText = totalExtras;
  const breakdown = Object.entries(current.extras).map(([k,v]) => `${k}:${v}`).join(', ');
  extrasBreakdown.innerText = breakdown;
}

function renderFallOfWickets(){
  fowList.innerHTML = current.fallOfWickets.map(fow => `${fow.wickets}-${fow.runs} (${fow.over})`).join('; ') || '<em>—</em>';
}

// -------------------- Recording events --------------------
function ensureBowler(bowlerName){
  if(!current.bowlers[bowlerName]) current.bowlers[bowlerName] = { legalBalls:0, runsConceded:0, wickets:0 };
}

// record run from bat (legal ball)
function recordRunOnBall(runs){
  const strikerName = strikerSelect.value || current.striker;
  const bowlerName = bowlerSelect.value || current.currentBowler;
  current.currentBowler = bowlerName;
  ensureBowler(bowlerName);

  // ball is legal
  current.legalBalls += 1;
  current.totalRuns += runs;
  // batsman credited
  const batsman = current.batsmen.find(b=>b.name===strikerName);
  if(batsman){
    batsman.runs += runs;
    batsman.balls += 1;
  }
  // bowler conceded
  current.bowlers[bowlerName].runsConceded += runs;
  current.bowlers[bowlerName].legalBalls += 1;

  // push event into current over (create if needed)
  pushEvent({ type:'run', runs, player:strikerName, bowler:bowlerName, legal:true, isFreeHit: current.isFreeHit });

  // partnership
  current.partnershipRuns += runs;

  // odd runs => swap strike
  if(runs % 2 === 1){
    swapStrikers();
  }

  // reset free hit after a legal ball
  if(current.isFreeHit) current.isFreeHit = false;

  // end-of-over check
  if(current.legalBalls % 6 === 0){
    endOver();
  }

  genCommentary({ type:'run', runs, player:strikerName, bowler:bowlerName });
  renderAll();
  saveState();
  checkMatchEndAfterBall();
}

// record wicket on legal ball
function recordWicketOnBall(){
  const strikerName = strikerSelect.value || current.striker;
  const bowlerName = bowlerSelect.value || current.currentBowler;
  current.currentBowler = bowlerName;
  ensureBowler(bowlerName);

  // Handle Free Hit: Wicket does not count, but ball is legal.
  if (current.isFreeHit) {
    alert("Wicket on a Free Hit! The batsman is NOT OUT.");
    const runsOnWicketBall = safeInt(prompt("Enter runs scored on this delivery (e.g., from overthrows)", "0"));
    if (runsOnWicketBall > 0) {
      recordRunOnBall(runsOnWicketBall); // Record runs and let it handle the rest
    } else {
      // Treat as a dot ball where the wicket is nullified
      recordRunOnBall(0);
    }
    // The free hit is now consumed. recordRunOnBall handles the flag reset.
    return;
  }

  current.legalBalls += 1;
  current.wickets += 1;
  // batsman marked out
  const batsman = current.batsmen.find(b=>b.name===strikerName);
  if(batsman) batsman.out = true;
  // bowler wicket
  current.bowlers[bowlerName].wickets += 1;
  current.bowlers[bowlerName].legalBalls += 1;

  pushEvent({ type:'wicket', player:strikerName, bowler:bowlerName, legal:true, isFreeHit: false });
  genCommentary({ type:'wicket', player:strikerName, bowler:bowlerName });

  // record fall of wicket
  current.fallOfWickets.push({ wickets: current.wickets, runs: current.totalRuns, over: formatOvers(current.legalBalls) });

  // record partnership and reset for next pair
  current.partnerships.push({ players:[current.striker, current.nonStriker], runs: current.partnershipRuns });
  current.partnershipRuns = 0;

  // bring next batsman in (if available)
  const next = current.batsmen.find(b=>!b.out && b.name !== current.striker && b.name !== current.nonStriker);
  // find first not yet batted (i.e., runs=0 and not striker/nonStriker and not present)
  let nextIndex = current.batsmen.findIndex(b => !b.out && b.name !== current.striker && b.name !== current.nonStriker && (b.balls === 0 && b.runs===0));
  if(nextIndex === -1){
    // fallback: find any not out and not in pair
    nextIndex = current.batsmen.findIndex(b => !b.out && b.name !== current.striker && b.name !== current.nonStriker);
  }
  if(nextIndex >= 0){
    const nextB = current.batsmen[nextIndex].name;
    current.striker = nextB; // new batsman takes strike
    strikerSelect.value = current.striker;
  } else {
    // all out
    alert('All out — innings over');
    endInnings();
    return;
  }

  // over end?
  if(current.legalBalls % 6 === 0){
    endOver();
  }
  renderAll();
  saveState();
  checkMatchEndAfterBall();
}

// record extra (wide/no-ball/bye/legbye)
// For wides/no-balls, these do NOT count as legal ball; for bye/legbye they do.
function recordExtra(type){
  // prompt for runs (default 1)
  const input = prompt(`Enter runs for ${type} (including automatic extra):`, "1");
  if(input === null) return;
  const extraRuns = Math.max(0, safeInt(input));

  const bowlerName = bowlerSelect.value || current.currentBowler;
  if(bowlerName) ensureBowler(bowlerName);

  // add extras to total and breakdown
  if(type === 'wide' || type === 'noball'){
    // not a legal ball: do not increment legalBalls
    current.totalRuns += extraRuns;
    current.extras[type] += extraRuns;
    if(bowlerName) current.bowlers[bowlerName].runsConceded += extraRuns;
    // Set Free Hit for No Ball
    if (type === 'noball') current.isFreeHit = true;
    pushEvent({ type:'extra', extraType:type, runs:extraRuns, bowler:bowlerName, legal:false });
    genCommentary({ type:'extra', extraType:type, runs:extraRuns, bowler:bowlerName });
  } else if(type === 'bye' || type === 'legbye'){
    // legal ball: increments legalBalls and not credited to batsman
    current.totalRuns += extraRuns;
    current.extras[type] += extraRuns;
    current.legalBalls += 1;
    // reset free hit after a legal ball
    if(current.isFreeHit) current.isFreeHit = false;
    // byes/legbyes not typically added to bowler runs conceded in some scoring rules; we'll NOT add to bowler.runsConceded
    pushEvent({ type:'extra', extraType:type, runs:extraRuns, bowler:bowlerName, legal:true, isFreeHit: current.isFreeHit });
    genCommentary({ type:'extra', extraType:type, runs:extraRuns, bowler:bowlerName });

    
    // update bowler if legal (we increment their ball count)
    if(bowlerName) current.bowlers[bowlerName].legalBalls += 1;

    // end-of-over check
    if(current.legalBalls % 6 === 0) endOver();
  }

  renderAll();
  saveState();
  checkMatchEndAfterBall();
}

// helper to push event into current over array
function pushEvent(event){
  if(!current.oversData.length) current.oversData.push([]);
  const curOver = current.oversData[current.oversData.length - 1];
  curOver.push(event);
}

// end of over actions
function endOver(){
  // finalize current over and create a new one
  // ensure that oversData has an item
  if(!current.oversData.length) current.oversData.push([]);
  // start new over only if innings not ended
  if(current.legalBalls < match.overs * 6 && current.wickets < 6){
    current.oversData.push([]);
  }
  // swap striker at end of over
  swapStrikers();
  renderAll();
  saveState();
}

// swap striker
function swapStrikers(){
  const tmp = current.striker;
  current.striker = current.nonStriker;
  current.nonStriker = tmp;
  // update selects
  strikerSelect.value = current.striker;
  nonStrikerSelect.value = current.nonStriker;
}

// -------------------- Event handlers for buttons --------------------
runBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const runs = safeInt(btn.dataset.run);
    recordRunOnBall(runs);
  });
});
wicketBtn.addEventListener('click', () => recordWicketOnBall());
swapStrikeBtn.addEventListener('click', () => { swapStrikers(); renderAll(); saveState(); });
wideBtn.addEventListener('click', () => recordExtra('wide'));
noBallBtn.addEventListener('click', () => recordExtra('noball'));
byeBtn.addEventListener('click', () => recordExtra('bye'));
legByeBtn.addEventListener('click', () => recordExtra('legbye'));
nextBallBtn.addEventListener('click', () => {
  // manually advance a legal dot ball (0 run)
  recordRunOnBall(0);
});
endInningsBtn.addEventListener('click', () => {
  if(confirm('End innings now?')) endInnings();
});

// selecting striker/bowler from dropdown updates current
strikerSelect.addEventListener('change', () => { current.striker = strikerSelect.value; renderAll(); saveState(); });
nonStrikerSelect.addEventListener('change', () => { current.nonStriker = nonStrikerSelect.value; renderAll(); saveState(); });
bowlerSelect.addEventListener('change', () => {
  current.currentBowler = bowlerSelect.value;
  // ensure bowler in bowlers map
  if(current.currentBowler) ensureBowler(current.currentBowler);
  renderBowlers();
  saveState();
});

// -------------------- End innings & End match --------------------
function endInnings(){
  // pack current innings summary
  const inningsSummary = {
    battingTeam: current.battingTeam,
    totalRuns: current.totalRuns,
    wickets: current.wickets,
    legalBalls: current.legalBalls,
    oversPlayed: formatOvers(current.legalBalls),
    batsmen: current.batsmen.map(b => ({ name:b.name, runs:b.runs, balls:b.balls, out:b.out })),
    bowlers: Object.entries(current.bowlers).map(([name,st]) => ({ name, legalBalls:st.legalBalls, runsConceded:st.runsConceded, wickets:st.wickets })),
    overs: current.oversData,
    extras: current.extras,
    partnerships: current.partnerships,
    fallOfWickets: current.fallOfWickets,
    isFreeHit: current.isFreeHit
  };

  match.innings.push(inningsSummary);

  // If first innings -> start second
  if(match.currentInnings === 1){
    match.currentInnings = 2;
    // Save state before starting the new innings to capture the first innings data
    saveState();
    startInnings( (match.teamA === current.battingTeam) ? match.teamB : match.teamA );
    // Note: startInnings now handles its own save and chart reset
    triggerExcelReport(); // Automatically export report after 1st innings
    // store target in match object implicitly via innings[0]
  } else {
    // match finished
    finalizeMatch();
  }
}

function checkMatchEndAfterBall(){
  // after each legal ball we check if second innings chasing completed or innings end
  if(match.currentInnings === 2 && match.innings[0]){
    const target = match.innings[0].totalRuns + 1;
    if(current.totalRuns >= target){
      // chasing team won
      const ballsRemaining = match.overs*6 - current.legalBalls;
      finalizeMatch(`${current.battingTeam} won by ${ballsRemaining} balls remaining`);
    }
  }
  // innings limit check
  if(current.legalBalls >= match.overs * 6 || current.wickets >= 6){
    endInnings();
  }
}

// determine winner and show summary
function finalizeMatch(customMessage){
  // ensure current innings saved if not already
  if(match.currentInnings === 2 && !match.innings[1]){
    // build second innings summary
    const inningsSummary = {
      battingTeam: current.battingTeam,
      totalRuns: current.totalRuns,
      wickets: current.wickets,
      legalBalls: current.legalBalls,
      oversPlayed: formatOvers(current.legalBalls),
      batsmen: current.batsmen.map(b => ({ name:b.name, runs:b.runs, balls:b.balls, out:b.out })),
      bowlers: Object.entries(current.bowlers).map(([name,st]) => ({ name, legalBalls:st.legalBalls, runsConceded:st.runsConceded, wickets:st.wickets })),
      overs: current.oversData,
      extras: current.extras,
      partnerships: current.partnerships,
      fallOfWickets: current.fallOfWickets,
      isFreeHit: current.isFreeHit
    };
    match.innings.push(inningsSummary);
  }

  // determine winner
  let winner = 'Tie';
  const i1 = match.innings[0];
  const i2 = match.innings[1];
  if(i1 && i2){
    if(i1.totalRuns > i2.totalRuns) winner = match.teamA;
    else if(i2.totalRuns > i1.totalRuns) winner = match.teamB;
    else winner = 'Tie';
  } else {
    winner = customMessage || 'Incomplete';
  }
  match.winner = customMessage || winner;

  // show summary in UI
  scorePanel.style.display = 'none';
  summaryPanel.style.display = 'block';
  let html = `<div><strong>${match.teamA}:</strong> ${i1 ? `${i1.totalRuns}/${i1.wickets} (${i1.oversPlayed})` : 'N/A'}</div>`;
  html += `<div><strong>${match.teamB}:</strong> ${i2 ? `${i2.totalRuns}/${i2.wickets} (${i2.oversPlayed})` : 'N/A'}</div>`;
  html += `<h3>🏆 ${match.winner}</h3>`;

  // batsman & bowler summary tables in HTML
  function tableForInning(inn){
    if(!inn) return `<div><em>No innings</em></div>`;
    const batsRows = inn.batsmen.map(b => `<tr><td>${b.name}</td><td>${b.runs}</td><td>${b.balls}</td><td>${ (b.balls>0 ? ((b.runs/b.balls)*100).toFixed(2) : '0.00') }</td></tr>`).join('');
    const bowlRows = inn.bowlers.map(b => `<tr><td>${b.name}</td><td>${Math.floor(b.legalBalls/6)}.${b.legalBalls%6}</td><td>${b.runsConceded}</td><td>${b.wickets}</td><td>${(b.legalBalls>0 ? (b.runsConceded / (b.legalBalls/6)).toFixed(2):'0.00')}</td></tr>`).join('');
    return `<div style="margin-top:8px;"><strong>${inn.battingTeam} Batting</strong>
      <table style="width:100%;margin-top:6px;"><thead><tr><th>Player</th><th>R</th><th>B</th><th>SR</th></tr></thead><tbody>${batsRows}</tbody></table>
      <div style="margin-top:8px;"><strong>Bowling</strong>
      <table style="width:100%;margin-top:6px;"><thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr></thead><tbody>${bowlRows}</tbody></table></div></div>`;
  }
  html += tableForInning(i1);
  html += tableForInning(i2);

  summaryContent.innerHTML = html;

  // allow download
  saveState(); // final save
  triggerExcelReport(); // Automatically export final match report
  // show also download button - handled in HTML already
}

// -------------------- Save / Load / Reset / Export --------------------
const STORAGE_KEY = 'cricketMatchInProgress';
function saveState(){
  const toSave = { match, current }; // keep current for recovery
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}
function loadSavedMatch(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return alert('No saved match found');
  const st = JSON.parse(raw);
  match = st.match;
  // if match currently in progress in innings
  if(match.currentInnings && !match.innings[match.currentInnings - 1]){
    // restore current state if present
    if(st.current && st.current.battingTeam){
      current = st.current;
      scorePanel.style.display='block';
      summaryPanel.style.display='none';
      updateSelects();
      renderAll();
      alert('Match restored from saved state');
      return;
    }
  }
  alert('Saved match loaded. If match was finished it will show summary.');
  // if finished show summary
  if(match.innings && match.innings.length >= 2){
    finalizeMatch();
  }
}

saveBtn.addEventListener('click', () => { saveState(); alert('Match saved to localStorage'); });

downloadJsonBtn.addEventListener('click', () => {
  const data = JSON.stringify(match, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `match_${match.teamA}_vs_${match.teamB}.json`.replace(/\s+/g,'_');
  a.click();
  URL.revokeObjectURL(url);
});

function triggerExcelReport() {
  if (!match || !match.innings || match.innings.length === 0) {
    console.warn('Not enough data to generate a report.');
    return;
  }
  const reportObj = {
    teamA: match.teamA,
    teamB: match.teamB,
    overs: match.overs,
    innings: match.innings.map(inn => ({
      battingTeam: inn.battingTeam,
      bowlingTeam: inn.battingTeam === match.teamA ? match.teamB : match.teamA, // Add bowling team for report
      totalRuns: inn.totalRuns,
      wickets: inn.wickets,
      oversPlayed: inn.oversPlayed,
      batsmen: inn.batsmen.map(b => ({ name:b.name, runs:b.runs, balls:b.balls, out: b.out, sr: b.balls>0 ? ((b.runs/b.balls)*100).toFixed(2) : '0.00' })),
      bowlers: inn.bowlers.map(b => ({ name:b.name, overs: `${Math.floor(b.legalBalls/6)}.${b.legalBalls%6}`, runs: b.runsConceded, wickets: b.wickets, econ: econFrom(b) })),
      extras: inn.extras,
      overHistory: inn.overs // Assuming inn.overs is the over-by-over data
    })),
    winner: match.winner || ''
  };

  if (typeof generateMatchReport === 'function') {
    generateMatchReport(reportObj);
  } else {
    alert('generateMatchReport() not found. Ensure report.js is loaded.');
  }
}

downloadExcelBtn.addEventListener('click', () => triggerExcelReport());

// new match
newMatchBtn.addEventListener('click', ()=> {
  if(confirm('Start a new match? This will clear current data.')){
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }
});

// -------------------- initial small helper to display starting UI --------------------
function initEmptyUI(){
  scorePanel.style.display = 'none';
  summaryPanel.style.display = 'none';
}
initEmptyUI();
