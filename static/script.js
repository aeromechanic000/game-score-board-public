// State Management
const state = {
    currentLang: 'en',
    columns: [
        { name: 'Player Name', type: 'text', required: true },
        { name: 'Result Score', type: 'number', required: true }
    ],
    players: [],
    history: [],
    leaderboard: {},
    theme: 'light'
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadFromBackend();
    initializeTable();
    renderHistory();
    renderLeaderboard();
    setupEventListeners();
    updateLanguage();
    applyTheme();
});

// Backend API functions
async function loadFromBackend() {
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            const data = await response.json();
            state.columns = data.columns || state.columns;
            state.players = data.players || [];
            state.history = data.history || [];
            state.leaderboard = data.leaderboard || {};
            state.theme = data.theme || 'light';
            state.currentLang = data.lang || 'en';
        }
    } catch (error) {
        console.error('Error loading data from backend:', error);
    }
}

async function saveToBackend() {
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                columns: state.columns,
                players: state.players,
                history: state.history,
                leaderboard: state.leaderboard,
                theme: state.theme,
                lang: state.currentLang
            })
        });
        
        if (!response.ok) {
            console.error('Error saving data to backend');
        }
    } catch (error) {
        console.error('Error saving data to backend:', error);
    }
}

async function updatePlayerDataBackend(playerIndex, colIndex, value) {
    try {
        const response = await fetch(`/api/players/${playerIndex}/${colIndex}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value })
        });
        
        if (response.ok) {
            const result = await response.json();
            updateStateFromBackend(result.data);
            // Don't re-render the table here - it causes input reset
        }
    } catch (error) {
        console.error('Error updating player data:', error);
    }
}

async function addPlayerBackend(playerData) {
    try {
        const response = await fetch('/api/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        });
        
        if (response.ok) {
            const result = await response.json();
            updateStateFromBackend(result.data);
            renderTableBody();
        }
    } catch (error) {
        console.error('Error adding player:', error);
    }
}

async function deletePlayerBackend(index) {
    try {
        const response = await fetch(`/api/players/${index}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const result = await response.json();
            updateStateFromBackend(result.data);
            renderTableBody();
        }
    } catch (error) {
        console.error('Error deleting player:', error);
    }
}

async function addColumnBackend(columnData) {
    try {
        const response = await fetch('/api/columns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(columnData)
        });
        
        if (response.ok) {
            const result = await response.json();
            updateStateFromBackend(result.data);
            initializeTable();
        }
    } catch (error) {
        console.error('Error adding column:', error);
    }
}

async function deleteColumnBackend(index) {
    try {
        const response = await fetch(`/api/columns/${index}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            const result = await response.json();
            updateStateFromBackend(result.data);
            initializeTable();
        }
    } catch (error) {
        console.error('Error deleting column:', error);
    }
}

async function finishGameBackend(gameData, leaderboardUpdates) {
    try {
        const response = await fetch('/api/game/finish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameData,
                leaderboard: leaderboardUpdates
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            updateStateFromBackend(result.data);
            renderHistory();
            renderLeaderboard();
            renderTableBody();
        }
    } catch (error) {
        console.error('Error finishing game:', error);
    }
}

async function clearCurrentBackend() {
    try {
        const response = await fetch('/api/game/clear', {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            updateStateFromBackend(result.data);
            renderTableBody();
        }
    } catch (error) {
        console.error('Error clearing current game:', error);
    }
}

async function clearAllBackend() {
    try {
        const response = await fetch('/api/all/clear', {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            updateStateFromBackend(result.data);
            initializeTable();
            renderHistory();
            renderLeaderboard();
        }
    } catch (error) {
        console.error('Error clearing all data:', error);
    }
}

async function updateSettingsBackend(settings) {
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        if (response.ok) {
            const result = await response.json();
            updateStateFromBackend(result.data);
        }
    } catch (error) {
        console.error('Error updating settings:', error);
    }
}

function updateStateFromBackend(data) {
    if (data.columns) state.columns = data.columns;
    if (data.players) state.players = data.players;
    if (data.history) state.history = data.history;
    if (data.leaderboard) state.leaderboard = data.leaderboard;
    if (data.theme) state.theme = data.theme;
    if (data.lang) state.currentLang = data.lang;
}

// Table initialization and rendering
function initializeTable() {
    renderTableHeader();
    renderTableBody();
}

function renderTableHeader() {
    const header = document.getElementById('tableHeader');
    header.innerHTML = '';
    
    state.columns.forEach((col, index) => {
        const th = document.createElement('th');
        const headerDiv = document.createElement('div');
        headerDiv.className = 'column-header';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = col.name;
        headerDiv.appendChild(nameSpan);
        
        if (!col.required) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.onclick = () => deleteColumn(index);
            headerDiv.appendChild(deleteBtn);
        }
        
        th.appendChild(headerDiv);
        header.appendChild(th);
    });
    
    // Actions column
    const actionsth = document.createElement('th');
    actionsth.textContent = 'Actions';
    actionsth.setAttribute('data-en', 'Actions');
    actionsth.setAttribute('data-zh', '操作');
    header.appendChild(actionsth);
}

function renderTableBody() {
    const tbody = document.getElementById('tableBody');
    
    // Store current focus information
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT');
    let focusInfo = null;
    
    if (isInputFocused) {
        const cell = activeElement.closest('td');
        if (cell) {
            const row = cell.closest('tr');
            const rowIndex = Array.from(tbody.children).indexOf(row);
            const cellIndex = Array.from(row.children).indexOf(cell);
            focusInfo = {
                rowIndex,
                cellIndex,
                selectionStart: activeElement.selectionStart,
                selectionEnd: activeElement.selectionEnd,
                value: activeElement.value
            };
        }
    }
    
    tbody.innerHTML = '';
    
    if (state.players.length === 0) {
        addPlayer();
        return;
    }
    
    state.players.forEach((player, playerIndex) => {
        const tr = document.createElement('tr');
        
        state.columns.forEach((col, colIndex) => {
            const td = document.createElement('td');
            
            if (col.type === 'text') {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = player.data[colIndex] || '';
                input.oninput = (e) => updatePlayerData(playerIndex, colIndex, e.target.value);
                td.appendChild(input);
            } else if (col.type === 'number') {
                const input = document.createElement('input');
                input.type = 'number';
                input.value = player.data[colIndex] || '';
                input.oninput = (e) => updatePlayerData(playerIndex, colIndex, e.target.value);
                td.appendChild(input);
            } else if (col.type === 'dropdown') {
                const select = document.createElement('select');
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '-';
                select.appendChild(emptyOption);
                
                (col.options || []).forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    select.appendChild(option);
                });
                
                select.value = player.data[colIndex] || '';
                select.onchange = (e) => updatePlayerData(playerIndex, colIndex, e.target.value);
                td.appendChild(select);
            }
            
            tr.appendChild(td);
        });
        
        // Actions cell
        const actionsTd = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('data-en', 'Delete');
        deleteBtn.setAttribute('data-zh', '删除');
        deleteBtn.onclick = () => deletePlayer(playerIndex);
        actionsTd.appendChild(deleteBtn);
        tr.appendChild(actionsTd);
        
        tbody.appendChild(tr);
    });
    
    updateLanguage();
    
    // Restore focus after rendering
    if (focusInfo !== null && tbody.children[focusInfo.rowIndex]) {
        const row = tbody.children[focusInfo.rowIndex];
        const cell = row.children[focusInfo.cellIndex];
        if (cell) {
            const input = cell.querySelector('input, select');
            if (input) {
                input.focus();
                if (input.tagName === 'INPUT' && typeof input.setSelectionRange === 'function') {
                    input.setSelectionRange(focusInfo.selectionStart, focusInfo.selectionEnd);
                }
            }
        }
    }
}

function updatePlayerData(playerIndex, colIndex, value) {
    state.players[playerIndex].data[colIndex] = value;
    updatePlayerDataBackend(playerIndex, colIndex, value);
}

function addPlayer() {
    const newPlayer = {
        data: new Array(state.columns.length).fill('')
    };
    addPlayerBackend(newPlayer);
}

function deletePlayer(index) {
    if (confirm(state.currentLang === 'en' ? 'Delete this player?' : '删除这个玩家？')) {
        deletePlayerBackend(index);
    }
}

function addColumn() {
    const modal = document.getElementById('columnModal');
    modal.classList.add('active');
    
    document.getElementById('columnName').value = '';
    document.getElementById('columnType').value = 'text';
    document.getElementById('dropdownOptions').style.display = 'none';
    document.getElementById('dropdownValues').value = '';
}

function deleteColumn(index) {
    if (confirm(state.currentLang === 'en' ? 'Delete this column?' : '删除这个列？')) {
        deleteColumnBackend(index);
    }
}

// History functions
function renderHistory() {
    const historyList = document.getElementById('historyList');
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    
    const filteredHistory = state.history.filter(game => {
        return game.players.some(p => p.toLowerCase().includes(searchTerm)) ||
               game.date.toLowerCase().includes(searchTerm);
    });
    
    historyList.innerHTML = '';
    
    filteredHistory.reverse().forEach((game, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const date = document.createElement('div');
        date.className = 'history-item-date';
        date.textContent = game.date;
        
        const players = document.createElement('div');
        players.className = 'history-item-players';
        players.textContent = game.players.join(', ');
        
        const winner = document.createElement('div');
        winner.className = 'history-item-winner';
        winner.textContent = `${state.currentLang === 'en' ? 'Winner' : '获胜者'}: ${game.winner}`;
        
        item.appendChild(date);
        item.appendChild(players);
        item.appendChild(winner);
        
        item.onclick = () => viewGameDetails(state.history.length - 1 - index);
        
        historyList.appendChild(item);
    });
}

function viewGameDetails(index) {
    const game = state.history[index];
    const details = `
Date: ${game.date}
Players: ${game.players.join(', ')}
Winner: ${game.winner}
Scores: ${JSON.stringify(game.scores, null, 2)}
    `.trim();
    
    alert(details);
}

// Leaderboard functions
function renderLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    
    const sortedPlayers = Object.entries(state.leaderboard)
        .sort((a, b) => b[1] - a[1]);
    
    leaderboardList.innerHTML = '';
    
    sortedPlayers.forEach(([name, score], index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        const rank = document.createElement('div');
        rank.className = 'leaderboard-rank';
        rank.textContent = `#${index + 1}`;
        
        const playerName = document.createElement('div');
        playerName.className = 'leaderboard-name';
        playerName.textContent = name;
        
        const playerScore = document.createElement('div');
        playerScore.className = 'leaderboard-score';
        playerScore.textContent = score;
        
        item.appendChild(rank);
        item.appendChild(playerName);
        item.appendChild(playerScore);
        
        leaderboardList.appendChild(item);
    });
}

// Game control functions
function finishGame() {
    if (state.players.length === 0) {
        alert(state.currentLang === 'en' ? 'No players to finish game!' : '没有玩家可以结束游戏！');
        return;
    }
    
    const playerNameIndex = state.columns.findIndex(col => col.name === 'Player Name');
    const resultScoreIndex = state.columns.findIndex(col => col.name === 'Result Score');
    
    const gameData = {
        date: new Date().toLocaleString(),
        players: [],
        scores: {},
        winner: ''
    };
    
    const leaderboardUpdates = {};
    let maxScore = -Infinity;
    let winner = '';
    
    state.players.forEach(player => {
        const name = player.data[playerNameIndex] || 'Unknown';
        const score = parseFloat(player.data[resultScoreIndex]) || 0;
        
        gameData.players.push(name);
        gameData.scores[name] = score;
        
        leaderboardUpdates[name] = score;
        
        if (score > maxScore) {
            maxScore = score;
            winner = name;
        }
    });
    
    gameData.winner = winner;
    
    finishGameBackend(gameData, leaderboardUpdates);
    
    alert(`${state.currentLang === 'en' ? 'Game finished! Winner' : '游戏结束！获胜者'}: ${winner}`);
}

function clearCurrent() {
    if (confirm(state.currentLang === 'en' ? 'Clear all current scores?' : '清空所有当前分数？')) {
        clearCurrentBackend();
    }
}

function clearAll() {
    if (confirm(state.currentLang === 'en' ? 
        'This will delete ALL data including history and leaderboard. Are you sure?' : 
        '这将删除包括历史记录和排行榜在内的所有数据。您确定吗？')) {
        clearAllBackend();
    }
}

// Export/Import functions
function exportStructure() {
    const data = {
        columns: state.columns
    };
    downloadJSON(data, 'table-structure.json');
}

function importStructure() {
    document.getElementById('structureFileInput').click();
}

function exportAll() {
    const data = {
        columns: state.columns,
        players: state.players,
        history: state.history,
        leaderboard: state.leaderboard
    };
    downloadJSON(data, 'game-data.json');
}

function importAll() {
    document.getElementById('dataFileInput').click();
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

async function handleStructureImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.columns) {
                state.columns = data.columns;
                state.players = [];
                await saveToBackend();
                initializeTable();
            }
        } catch (error) {
            alert(state.currentLang === 'en' ? 'Error importing file' : '导入文件错误');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

async function handleDataImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.columns) state.columns = data.columns;
            if (data.players) state.players = data.players;
            if (data.history) state.history = data.history;
            if (data.leaderboard) state.leaderboard = data.leaderboard;
            
            await saveToBackend();
            initializeTable();
            renderHistory();
            renderLeaderboard();
        } catch (error) {
            alert(state.currentLang === 'en' ? 'Error importing file' : '导入文件错误');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// AI Analysis
async function analyzeGame() {
    const playerNameIndex = state.columns.findIndex(col => col.name === 'Player Name');
    const resultScoreIndex = state.columns.findIndex(col => col.name === 'Result Score');
    
    if (state.players.length === 0) {
        alert(state.currentLang === 'en' ? 'No players to analyze!' : '没有玩家可以分析！');
        return;
    }
    
    const players = state.players.map(player => {
        const name = player.data[playerNameIndex] || 'Unknown';
        const score = parseFloat(player.data[resultScoreIndex]) || 0;
        
        const details = state.columns
            .filter((col, idx) => idx !== playerNameIndex && idx !== resultScoreIndex && player.data[idx])
            .map((col, idx) => `${col.name}: ${player.data[idx]}`)
            .join(', ');
        
        return { name, score, details };
    });
    
    const aiContent = document.getElementById('aiAnalysis');
    aiContent.textContent = state.currentLang === 'en' ? 'Analyzing game...' : '分析游戏中...';
    aiContent.className = 'ai-content loading';
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ players })
        });
        
        const data = await response.json();
        
        if (data.error) {
            aiContent.textContent = `Error: ${data.error}`;
        } else {
            aiContent.textContent = data.analysis;
        }
        aiContent.className = 'ai-content';
    } catch (error) {
        aiContent.textContent = state.currentLang === 'en' ? 
            'Error connecting to AI service. Please try again.' : 
            '连接 AI 服务时出错。请重试。';
        aiContent.className = 'ai-content';
    }
}

// Theme functions
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    updateSettingsBackend({ theme: state.theme });
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
}

// Language functions
function toggleLanguage() {
    state.currentLang = state.currentLang === 'en' ? 'zh' : 'en';
    updateLanguage();
    renderHistory();
    renderLeaderboard();
    updateSettingsBackend({ lang: state.currentLang });
}

function updateLanguage() {
    const elements = document.querySelectorAll('[data-en][data-zh]');
    elements.forEach(el => {
        if (el.tagName === 'INPUT' && el.hasAttribute('data-placeholder-en')) {
            el.placeholder = state.currentLang === 'en' ? 
                el.getAttribute('data-placeholder-en') : 
                el.getAttribute('data-placeholder-zh');
        } else {
            el.textContent = state.currentLang === 'en' ? 
                el.getAttribute('data-en') : 
                el.getAttribute('data-zh');
        }
    });
}

// Event listeners
function setupEventListeners() {
    document.getElementById('finishGame').addEventListener('click', finishGame);
    document.getElementById('clearCurrent').addEventListener('click', clearCurrent);
    document.getElementById('exportStructure').addEventListener('click', exportStructure);
    document.getElementById('importStructure').addEventListener('click', importStructure);
    document.getElementById('exportAll').addEventListener('click', exportAll);
    document.getElementById('importAll').addEventListener('click', importAll);
    document.getElementById('clearAll').addEventListener('click', clearAll);
    document.getElementById('toggleTheme').addEventListener('click', toggleTheme);
    document.getElementById('toggleLang').addEventListener('click', toggleLanguage);
    document.getElementById('addColumn').addEventListener('click', addColumn);
    document.getElementById('addPlayer').addEventListener('click', addPlayer);
    document.getElementById('analyzeBtn').addEventListener('click', analyzeGame);
    document.getElementById('historySearch').addEventListener('input', renderHistory);
    
    // Modal handlers
    document.getElementById('columnType').addEventListener('change', (e) => {
        const dropdown = document.getElementById('dropdownOptions');
        dropdown.style.display = e.target.value === 'dropdown' ? 'block' : 'none';
    });
    
    document.getElementById('saveColumn').addEventListener('click', () => {
        const name = document.getElementById('columnName').value.trim();
        const type = document.getElementById('columnType').value;
        
        if (!name) {
            alert(state.currentLang === 'en' ? 'Please enter a column name' : '请输入列名称');
            return;
        }
        
        const newColumn = { name, type, required: false };
        
        if (type === 'dropdown') {
            const values = document.getElementById('dropdownValues').value
                .split(',')
                .map(v => v.trim())
                .filter(v => v);
            newColumn.options = values;
        }
        
        // Find the Result Score column index
        const resultScoreIndex = state.columns.findIndex(col => col.name === 'Result Score');
        
        // Insert before Result Score, or at the end if not found
        if (resultScoreIndex !== -1) {
            state.columns.splice(resultScoreIndex, 0, newColumn);
            // Update all players to add empty value at this position
            state.players.forEach(player => {
                player.data.splice(resultScoreIndex, 0, '');
            });
        } else {
            state.columns.push(newColumn);
            state.players.forEach(player => {
                player.data.push('');
            });
        }
        
        saveToBackend();
        initializeTable();
        
        document.getElementById('columnModal').classList.remove('active');
    });

    document.getElementById('cancelColumn').addEventListener('click', () => {
        document.getElementById('columnModal').classList.remove('active');
    });
    
    // File input handlers
    document.getElementById('structureFileInput').addEventListener('change', handleStructureImport);
    document.getElementById('dataFileInput').addEventListener('change', handleDataImport);
}