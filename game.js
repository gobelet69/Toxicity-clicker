console.log("game.js loaded");

let flameCount = 0;
let flamePerSecond = 0;
let farmers = [];
let units = [];
let incrementPerClick = 1;

// Utility functions
function getUnit(value) {
    if (units.length === 0) {
        return { name: '', value: 1 };
    }
    return units.slice().reverse().find(unit => value >= unit.value) || units[0];
}

function formatCost(cost) {
    const unit = getUnit(cost);
    return `${(cost / unit.value).toFixed(2)} ${unit.name}`;
}

function formatValue(value) {
    const unit = getUnit(value);
    return `${(value / unit.value).toFixed(2)} ${unit.name}`;
}

function loadFarmers() {
    fetch('farmers.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                farmers = data.map(farmer => ({
                    ...farmer,
                    level: 0,
                    totalFlamePerSecond: 0,
                    initialBaseCost: farmer.baseCost,
                    initialBaseFlamePerSecond: farmer.baseFlamePerSecond
                }));
                console.log("Farmers loaded:", farmers);
                displayFarmers();
            } else {
                console.error('Error loading farmers: Data is not an array');
            }
        })
        .catch(error => console.error('Error loading farmers:', error));
}

function loadUnits() {
    fetch('units.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            units = data.units;
            console.log("Units loaded:", units);
            updateFlameCount();
        })
        .catch(error => console.error('Error loading units:', error));
}

function handleFlameClick() {
    flameCount += incrementPerClick;
    updateFlameCount();
}

document.getElementById('circle').addEventListener('click', handleFlameClick);

function updateFlameCount() {
    document.getElementById("flameCount").textContent = formatValue(flameCount);
    updateFlamesPerSecond();
}

function updateFlamesPerSecond() {
    document.getElementById("flamesPerSecond").textContent = formatValue(flamePerSecond);
}

function displayFarmers() {
    const farmersContainer = document.getElementById("farmersContainer");
    farmersContainer.innerHTML = '';

    farmers.forEach(farmer => {
        let farmerItem = document.createElement("li");
        farmerItem.className = "farmer-item";

        let farmerName = document.createElement("span");
        farmerName.textContent = `${farmer.name} - Cost: ${formatCost(farmer.baseCost)} - Level: ${farmer.level} - FPS: ${formatValue(farmer.totalFlamePerSecond)}`;
        farmerItem.appendChild(farmerName);

        let buyButton = document.createElement("button");
        buyButton.textContent = "Buy";
        buyButton.addEventListener('click', () => buyFarmer(farmer));
        farmerItem.appendChild(buyButton);

        farmersContainer.appendChild(farmerItem);
    });
}

function buyFarmer(farmer) {
    if (flameCount >= farmer.baseCost) {
        flameCount -= farmer.baseCost;
        flamePerSecond += farmer.baseFlamePerSecond;

        farmer.level += 1;
        farmer.totalFlamePerSecond += farmer.baseFlamePerSecond;
        farmer.baseCost = eval(farmer.upgradeCostFunction.replace('baseCost', farmer.baseCost));
        farmer.baseFlamePerSecond = eval(farmer.flamePerSecondAfterUpgradesFunction.replace('baseFlamePerSecond', farmer.baseFlamePerSecond));

        updateFlameCount();
        updateFlamesPerSecond();
        displayFarmers();
    }
}

function setFlameCount(value) {
    flameCount = value;
    updateFlameCount();
}

function initializeSettings() {
    const flameInput = document.getElementById('flameInput');
    const setFlameButton = document.getElementById('setFlameButton');

    setFlameButton.addEventListener('click', () => {
        const inputFlameCount = parseFloat(flameInput.value);
        if (!isNaN(inputFlameCount)) {
            flameCount = inputFlameCount;
            updateFlameCount();
        }
    });

    setInterval(() => {
        flameCount += flamePerSecond / 10;
        updateFlameCount();
    }, 100);

    loadUnits();
    loadFarmers();
}

function saveGameState() {
    const gameState = {
        flameCount,
        flamePerSecond,
        farmers
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
    console.log('Game state saved:', gameState);
}

function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        return JSON.parse(savedState);
    }
    return null;
}

function resetGame() {
    flameCount = 0;
    flamePerSecond = 0;
    farmers.forEach(farmer => {
        farmer.level = 0;
        farmer.totalFlamePerSecond = 0;
        farmer.baseCost = farmer.initialBaseCost;
        farmer.baseFlamePerSecond = farmer.initialBaseFlamePerSecond;
    });
    updateFlameCount();
    updateFlamesPerSecond();
    displayFarmers();
    saveGameState();
}

function exportGameState() {
    const gameState = {
        flameCount,
        flamePerSecond,
        farmers
    };
    const gameStateString = JSON.stringify(gameState);
    const blob = new Blob([gameStateString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gameState.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function importGameState(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const gameStateString = e.target.result;
            const gameState = JSON.parse(gameStateString);
            flameCount = gameState.flameCount;
            flamePerSecond = gameState.flamePerSecond;
            farmers = gameState.farmers;
            updateFlameCount();
            displayFarmers();
            saveGameState();
        };
        reader.readAsText(file);
    }
}

document.getElementById('resetButton').addEventListener('click', resetGame);
document.getElementById('exportButton').addEventListener('click', exportGameState);
document.getElementById('importButton').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
});
document.getElementById('importFileInput').addEventListener('change', importGameState);
document.getElementById('saveButton').addEventListener('click', saveGameState)

loadUnits();
loadFarmers();

const gameState = loadGameState();
if (gameState) {
    flameCount = gameState.flameCount;
    flamePerSecond = gameState.flamePerSecond;
    farmers = gameState.farmers;
    updateFlameCount();
    displayFarmers();
}

initializeSettings();

setInterval(() => {
    saveGameState();
}, 10000);