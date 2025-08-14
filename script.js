// Beach Tournament Manager - JavaScript
class TournamentManager {
    constructor() {
        this.games = [];
        this.currentGames = [];
        this.nextGames = [];
        this.finishedGames = [];
        this.googleSheetsId = null;
        this.apiKey = null;
        
        this.init();
    }

    async init() {
        try {
            // Load configuration
            await this.loadConfig();
            
            // Load initial data
            await this.loadTournamentData();
            
        } catch (error) {
            this.showError('Failed to initialize tournament manager: ' + error.message);
        }
    }

    async loadConfig() {
        try {
            // For demo purposes, you can hardcode these values
            // In production, you'd want to load these from a config file or environment variables
            this.googleSheetsId = 'YOUR_GOOGLE_SHEET_ID_HERE';
            this.apiKey = 'YOUR_GOOGLE_API_KEY_HERE';
            
            // If you don't have these yet, show a setup message
            if (!this.googleSheetsId || this.googleSheetsId === 'YOUR_GOOGLE_SHEET_ID_HERE') {
                this.showSetupInstructions();
                return;
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    showSetupInstructions() {
        const loadingEl = document.getElementById('loading');
        loadingEl.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-cog" style="font-size: 3rem; color: #ff6b6b; margin-bottom: 20px;"></i>
                <h3>Setup Required</h3>
                <p>To use this tournament manager, you need to:</p>
                <ol style="text-align: left; max-width: 500px; margin: 20px auto;">
                    <li>Create a Google Sheet with tournament data</li>
                    <li>Get your Google Sheets ID from the URL</li>
                    <li>Enable Google Sheets API and get an API key</li>
                    <li>Update the configuration in script.js</li>
                </ol>
                <p><strong>For now, using demo data to show the interface.</strong></p>
                <button onclick="tournamentManager.loadDemoData()" class="refresh-btn">
                    <i class="fas fa-play"></i> Load Demo Data
                </button>
            </div>
        `;
    }

    async loadTournamentData() {
        try {
            this.showLoading(true);
            
            if (this.googleSheetsId && this.googleSheetsId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
                await this.loadFromGoogleSheets();
            } else {
                // Load demo data if no Google Sheets configured
                await this.loadDemoData();
            }
            
            this.categorizeGames();
            this.renderGames();
            this.showLoading(false);
            
        } catch (error) {
            this.showError('Failed to load tournament data: ' + error.message);
            this.showLoading(false);
        }
    }

    async loadFromGoogleSheets() {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.googleSheetsId}/values/Sheet1?key=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.parseGoogleSheetsData(data.values);
            
        } catch (error) {
            console.error('Error loading from Google Sheets:', error);
            throw new Error('Failed to connect to Google Sheets. Please check your API key and sheet ID.');
        }
    }

    parseGoogleSheetsData(values) {
        if (!values || values.length < 2) {
            throw new Error('No data found in Google Sheet');
        }

        const headers = values[0];
        this.games = [];

        for (let i = 1; i < values.length; i++) {
            const row = values[i];
            if (row.length >= headers.length) {
                const game = {
                    id: i,
                    teamA: row[0] || 'Team A',
                    teamB: row[1] || 'Team B',
                    court: row[2] || 'Court 1',
                    time: row[3] || '10:00 AM',
                    status: row[4] || 'scheduled', // scheduled, current, finished
                    sets: [
                        { teamAScore: row[5] || '', teamBScore: row[6] || '' },
                        { teamAScore: row[7] || '', teamBScore: row[8] || '' },
                        { teamAScore: row[9] || '', teamBScore: row[10] || '' }
                    ],
                    date: row[11] || new Date().toLocaleDateString()
                };
                this.games.push(game);
            }
        }
    }

    loadDemoData() {
        // Demo data to show the interface
        this.games = [
            {
                id: 1,
                teamA: 'Beach Bombers',
                teamB: 'Sand Sharks',
                court: 'Court 1',
                time: '10:00 AM',
                status: 'current',
                sets: [
                    { teamAScore: 21, teamBScore: 19 },
                    { teamAScore: 18, teamBScore: 21 },
                    { teamAScore: '', teamBScore: '' }
                ],
                date: '2024-01-15'
            },
            {
                id: 2,
                teamA: 'Volley Vikings',
                teamB: 'Sunset Spikers',
                court: 'Court 2',
                time: '10:30 AM',
                status: 'current',
                sets: [
                    { teamAScore: 21, teamBScore: 18 },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                date: '2024-01-15'
            },
            {
                id: 3,
                teamA: 'Wave Warriors',
                teamB: 'Tide Titans',
                court: 'Court 1',
                time: '11:00 AM',
                status: 'scheduled',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                date: '2024-01-15'
            },
            {
                id: 4,
                teamA: 'Coastal Crushers',
                teamB: 'Ocean Outlaws',
                court: 'Court 2',
                time: '11:30 AM',
                status: 'scheduled',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                date: '2024-01-15'
            },
            {
                id: 5,
                teamA: 'Beach Bandits',
                teamB: 'Sand Storm',
                court: 'Court 1',
                time: '9:00 AM',
                status: 'finished',
                sets: [
                    { teamAScore: 21, teamBScore: 15 },
                    { teamAScore: 21, teamBScore: 18 }
                ],
                date: '2024-01-15'
            },
            {
                id: 6,
                teamA: 'Volley Vipers',
                teamB: 'Sunset Strikers',
                court: 'Court 2',
                time: '9:30 AM',
                status: 'finished',
                sets: [
                    { teamAScore: 19, teamBScore: 21 },
                    { teamAScore: 18, teamBScore: 21 }
                ],
                date: '2024-01-15'
            }
        ];
    }

    categorizeGames() {
        this.currentGames = this.games.filter(game => game.status === 'current');
        this.nextGames = this.games.filter(game => game.status === 'scheduled');
        this.finishedGames = this.games.filter(game => game.status === 'finished');
    }

    renderGames() {
        this.renderGameSection('currentGames', this.currentGames, 'current');
        this.renderGameSection('nextGames', this.nextGames, 'next');
        this.renderGameSection('finishedGames', this.finishedGames, 'finished');
    }

    renderGameSection(containerId, games, status) {
        const container = document.getElementById(containerId);
        
        if (games.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #6c757d; font-style: italic;">No ${status} games at the moment.</p>`;
            return;
        }

        container.innerHTML = games.map(game => this.createGameCard(game, status)).join('');
    }

    createGameCard(game, status) {
        const statusClass = `status-${status}`;
        const statusText = status === 'current' ? 'LIVE' : 
                          status === 'next' ? 'NEXT' : 'FINISHED';
        
        // Calculate set scores and match status
        const setScores = this.calculateSetScores(game.sets);
        const matchStatus = this.getMatchStatus(game.sets);
        
        let scoreSection = '';
        if (status === 'finished') {
            scoreSection = `
                <div class="sets-display">
                    <div class="set-row">
                        <span class="set-label">Set 1:</span>
                        <span class="set-score">${game.sets[0].teamAScore} - ${game.sets[0].teamBScore}</span>
                    </div>
                    <div class="set-row">
                        <span class="set-label">Set 2:</span>
                        <span class="set-score">${game.sets[1].teamAScore} - ${game.sets[1].teamBScore}</span>
                    </div>
                    ${game.sets[2] && game.sets[2].teamAScore && game.sets[2].teamBScore ? 
                        `<div class="set-row">
                            <span class="set-label">Set 3:</span>
                            <span class="set-score">${game.sets[2].teamAScore} - ${game.sets[2].teamBScore}</span>
                        </div>` : ''
                    }
                    <div class="match-result">
                        <strong>Winner: ${this.getWinner(game.sets)}</strong>
                    </div>
                </div>
            `;
        } else if (status === 'current') {
            scoreSection = `
                <div class="sets-display">
                    <div class="set-row">
                        <span class="set-label">Set 1:</span>
                        <span class="set-score">${game.sets[0].teamAScore || '0'} - ${game.sets[0].teamBScore || '0'}</span>
                    </div>
                    <div class="set-row">
                        <span class="set-label">Set 2:</span>
                        <span class="set-score">${game.sets[1].teamAScore || '0'} - ${game.sets[1].teamBScore || '0'}</span>
                    </div>
                    ${this.shouldShowSet3(game.sets) ? 
                        `<div class="set-row">
                            <span class="set-label">Set 3:</span>
                            <span class="set-score">${game.sets[2].teamAScore || '0'} - ${game.sets[2].teamBScore || '0'}</span>
                        </div>` : ''
                    }
                </div>
                <div class="score-input">
                    <div class="set-input-group">
                        <label>Set ${this.getNextSetToFill(game.sets)}:</label>
                        <div class="set-inputs">
                            <input type="number" id="set${this.getNextSetToFill(game.sets)}_scoreA_${game.id}" 
                                   placeholder="Team A" min="0" max="30" 
                                   value="${this.getSetScore(game.sets, this.getNextSetToFill(game.sets) - 1, 'A')}">
                            <span class="set-separator">-</span>
                            <input type="number" id="set${this.getNextSetToFill(game.sets)}_scoreB_${game.id}" 
                                   placeholder="Team B" min="0" max="30" 
                                   value="${this.getSetScore(game.sets, this.getNextSetToFill(game.sets) - 1, 'B')}">
                        </div>
                    </div>
                    <button class="submit-score" onclick="tournamentManager.submitSetScore(${game.id}, ${this.getNextSetToFill(game.sets)})">
                        <i class="fas fa-save"></i> Update Set ${this.getNextSetToFill(game.sets)}
                    </button>
                </div>
            `;
        } else {
            scoreSection = `
                <div class="game-info">
                    <div class="info-item">
                        <strong>Status</strong>
                        <div>Upcoming</div>
                    </div>
                    <div class="info-item">
                        <strong>Court</strong>
                        <div>${game.court}</div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="game-card ${status}">
                <div class="game-header">
                    <h3>Game ${game.id}</h3>
                    <span class="game-status ${statusClass}">${statusText}</span>
                </div>
                
                <div class="teams">
                    <div class="team team-a">
                        <span>${game.teamA}</span>
                        <span class="team-score">${setScores.teamA}</span>
                    </div>
                    <div class="team team-b">
                        <span>${game.teamB}</span>
                        <span class="team-score">${setScores.teamB}</span>
                    </div>
                </div>
                
                <div class="game-info">
                    <div class="info-item">
                        <strong>Court</strong>
                        <div>${game.court}</div>
                    </div>
                    <div class="info-item">
                        <strong>Time</strong>
                        <div>${game.time}</div>
                    </div>
                </div>
                
                ${scoreSection}
            </div>
        `;
    }

    // Helper functions for set management
    calculateSetScores(sets) {
        let teamASets = 0;
        let teamBSets = 0;
        
        sets.forEach(set => {
            if (set.teamAScore && set.teamBScore) {
                if (parseInt(set.teamAScore) > parseInt(set.teamBScore)) {
                    teamASets++;
                } else {
                    teamBSets++;
                }
            }
        });
        
        return { teamA: teamASets, teamB: teamBSets };
    }

    getMatchStatus(sets) {
        const scores = this.calculateSetScores(sets);
        if (scores.teamA === 2) return 'teamA_wins';
        if (scores.teamB === 2) return 'teamB_wins';
        return 'in_progress';
    }

    shouldShowSet3(sets) {
        const scores = this.calculateSetScores(sets);
        return scores.teamA === 1 && scores.teamB === 1;
    }

    getNextSetToFill(sets) {
        for (let i = 0; i < sets.length; i++) {
            if (!sets[i].teamAScore || !sets[i].teamBScore) {
                return i + 1;
            }
        }
        return 3; // All sets filled
    }

    getSetScore(sets, setIndex, team) {
        if (sets[setIndex] && sets[setIndex][`team${team}Score`]) {
            return sets[setIndex][`team${team}Score`];
        }
        return '';
    }

    getWinner(sets) {
        const scores = this.calculateSetScores(sets);
        if (scores.teamA > scores.teamB) return 'Team A';
        return 'Team B';
    }

    validateSetScore(scoreA, scoreB, setNumber) {
        const maxPoints = setNumber === 3 ? 15 : 21;
        
        // Check if scores are valid
        if (!scoreA || !scoreB) {
            return { valid: false, message: 'Both scores must be entered' };
        }
        
        const scoreAInt = parseInt(scoreA);
        const scoreBInt = parseInt(scoreB);
        
        if (scoreAInt < 0 || scoreBInt < 0) {
            return { valid: false, message: 'Scores cannot be negative' };
        }
        
        // Check if one team reached the winning score
        if (scoreAInt >= maxPoints || scoreBInt >= maxPoints) {
            // Check for 2-point advantage rule
            const difference = Math.abs(scoreAInt - scoreBInt);
            if (difference >= 2) {
                return { valid: true, message: 'Valid set score' };
            } else {
                return { valid: false, message: `Set ${setNumber} requires a 2-point advantage to win` };
            }
        }
        
        return { valid: true, message: 'Valid set score' };
    }

    async submitSetScore(gameId, setNumber) {
        try {
            const scoreA = document.getElementById(`set${setNumber}_scoreA_${gameId}`).value;
            const scoreB = document.getElementById(`set${setNumber}_scoreB_${gameId}`).value;
            
            // Validate the set score
            const validation = this.validateSetScore(scoreA, scoreB, setNumber);
            if (!validation.valid) {
                alert(validation.message);
                return;
            }
            
            // Find the game and update the set
            const game = this.games.find(g => g.id === gameId);
            if (game) {
                const setIndex = setNumber - 1;
                game.sets[setIndex].teamAScore = scoreA;
                game.sets[setIndex].teamBScore = scoreB;
                
                // Check if match is finished
                const matchStatus = this.getMatchStatus(game.sets);
                if (matchStatus !== 'in_progress') {
                    game.status = 'finished';
                }
                
                // Re-categorize and re-render
                this.categorizeGames();
                this.renderGames();
                
                // In a real implementation, you'd save this to Google Sheets
                if (this.googleSheetsId && this.googleSheetsId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
                    await this.updateGoogleSheets(gameId, setNumber, scoreA, scoreB);
                }
                
                alert(`Set ${setNumber} score updated successfully!`);
            }
            
        } catch (error) {
            this.showError('Failed to update set score: ' + error.message);
        }
    }

    async submitScore(gameId) {
        // Legacy function - now redirects to set-based scoring
        this.submitSetScore(gameId, this.getNextSetToFill(this.games.find(g => g.id === gameId).sets));
    }

    async updateGoogleSheets(gameId, setNumber, scoreA, scoreB) {
        // This would implement the actual Google Sheets update
        // For now, just log the action
        console.log(`Updating game ${gameId}, set ${setNumber} with scores: ${scoreA} - ${scoreB}`);
        
        // In a real implementation, you'd use the Google Sheets API to update the specific row
        // This requires more complex authentication and API calls
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        loadingEl.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        const errorEl = document.getElementById('error');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}

// Initialize the tournament manager when the page loads
let tournamentManager;

document.addEventListener('DOMContentLoaded', () => {
    tournamentManager = new TournamentManager();
});

// Global function for the refresh button
function refreshData() {
    if (tournamentManager) {
        tournamentManager.loadTournamentData();
    }
}

