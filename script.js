// Predefined players
const players = [
    { name: "Ganesh", expertise: "Baller - Faster", available: true },
    { name: "Paresh", expertise: "All Rounder", available: true },
    { name: "Nilesh", expertise: "Batsman", available: true },
    { name: "Pradip", expertise: "Baller - Spinner", available: true },
    { name: "Vijay", expertise: "All Rounder", available: true },
    { name: "Jayesh", expertise: "Baller - Faster", available: true },
    { name: "Dinesh", expertise: "All Rounder", available: true },
    { name: "Pratik", expertise: "All Rounder", available: true },
    { name: "Hardeep", expertise: "All Rounder", available: true },
    { name: "Vikas", expertise: "Batsman", available: true },
];

// DOM elements
const playerForm = document.getElementById('playerForm');
const playersDiv = document.getElementById('players');
const resultDiv = document.getElementById('result');
const coinDiv = document.getElementById('coin');

// Display players
function displayPlayers() {
    playersDiv.innerHTML = players.map((p, i) => `
        <label>
            <input type="checkbox" data-index="${i}" ${p.available ? 'checked' : ''}>
            ${p.name} (${p.expertise})
        </label>
    `).join('');
}
displayPlayers();

// Add player
playerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('playerName').value;
    const expertise = document.getElementById('expertise').value;
    players.push({ name, expertise, available: true });
    displayPlayers();
});

// Update availability
playersDiv.addEventListener('change', (e) => {
    const index = e.target.dataset.index;
    players[index].available = e.target.checked;
});

// Shuffle and create teams
document.getElementById('createTeams').addEventListener('click', () => {
    const availablePlayers = players.filter(p => p.available);
    if (availablePlayers.length < 2) {
        resultDiv.innerHTML = '<p>Not enough players to create teams!</p>';
        return;
    }

    const teams = [[], []];
    availablePlayers.sort(() => Math.random() - 0.5).forEach((p, i) => {
        teams[i % 2].push(p);
    });

    resultDiv.innerHTML = `
        <h3>Team 1</h3>
        ${teams[0].map(p => `<p>${p.name} (${p.expertise})</p>`).join('')}
        <h3>Team 2</h3>
        ${teams[1].map(p => `<p>${p.name} (${p.expertise})</p>`).join('')}
    `;
});

// Toss with coin flip animation
document.getElementById('toss').addEventListener('click', () => {
    coinDiv.classList.remove('hidden');
    coinDiv.style.transform = 'rotateY(0)';
    setTimeout(() => {
        const isHeads = Math.random() < 0.5;
        coinDiv.style.transform = `rotateY(${isHeads ? 180 : 0}deg)`;
        resultDiv.innerHTML = `<h2>${isHeads ? 'Heads' : 'Tails'} Wins the Toss!</h2>`;
    }, 500);
});
