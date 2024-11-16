// Predefined players with expertise
const players = [
    { name: "Ganesh", expertise: "Baller - Faster" },
    { name: "Paresh", expertise: "All Rounder" },
    { name: "Nilesh", expertise: "Batsman" },
    { name: "Pradip", expertise: "Baller - Spinner" },
    { name: "Vijay", expertise: "All Rounder" },
    { name: "Jayesh", expertise: "Baller - Faster" },
    { name: "Dinesh", expertise: "All Rounder" },
    { name: "Pratik", expertise: "All Rounder" },
    { name: "Hardeep", expertise: "All Rounder" },
    { name: "Vikas", expertise: "Batsman" },
    { name: "Mars", expertise: "Batsman" },
    { name: "Shets", expertise: "Batsman" },
    { name: "Manjabapu", expertise: "Batsman" },
    { name: "Gaurav", expertise: "All Rounder" },
    { name: "Yuvraj", expertise: "Batsman" },
    { name: "Akshay Ghejji", expertise: "Batsman" }
];

// DOM elements
const playerForm = document.getElementById('playerForm');
const playersDiv = document.getElementById('players');
const resultDiv = document.getElementById('result');

// Display initial players
displayPlayers();

// Add new players dynamically
playerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('playerName').value;
    const expertise = document.getElementById('expertise').value;
    players.push({ name, expertise });
    document.getElementById('playerName').value = '';
    displayPlayers();
});

// Display players list
function displayPlayers() {
    playersDiv.innerHTML = '<h2>Player List:</h2>' + players.map((p, i) =>
        `<p>${i + 1}. ${p.name} (${p.expertise})</p>`).join('');
}

// Shuffle teams
document.getElementById('shuffleTeams').addEventListener('click', () => {
    if (players.length < 2) {
        resultDiv.innerHTML = '<p>Please add more players to shuffle teams.</p>';
        return;
    }
    const shuffled = players.sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    const team1 = shuffled.slice(0, mid);
    const team2 = shuffled.slice(mid);
    resultDiv.innerHTML = `
        <h3>Team 1</h3>
        ${team1.map(p => `<p>${p.name} (${p.expertise})</p>`).join('')}
        <h3>Team 2</h3>
        ${team2.map(p => `<p>${p.name} (${p.expertise})</p>`).join('')}
    `;
});

// Toss functionality
document.getElementById('toss').addEventListener('click', () => {
    const tossResult = Math.random() < 0.5 ? 'Team 1 wins the toss!' : 'Team 2 wins the toss!';
    resultDiv.innerHTML = `<h2>${tossResult}</h2>`;
});
