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
                    scoreA: row[5] || '',
                    scoreB: row[6] || '',
                    date: row[7] || new Date().toLocaleDateString()
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
                scoreA: '21',
                scoreB: '19',
                date: '2024-01-15'
            },
            {
                id: 2,
                teamA: 'Volley Vikings',
                teamB: 'Sunset Spikers',
                court: 'Court 2',
                time: '10:30 AM',
                status: 'current',
                scoreA: '18',
                scoreB: '21',
                date: '2024-01-15'
            },
            {
                id: 3,
                teamA: 'Wave Warriors',
                teamB: 'Tide Titans',
                court: 'Court 1',
                time: '11:00 AM',
                status: 'scheduled',
                scoreA: '',
                scoreB: '',
                date: '2024-01-15'
            },
            {
                id: 4,
                teamA: 'Coastal Crushers',
                teamB: 'Ocean Outlaws',
                court: 'Court 2',
                time: '11:30 AM',
                status: 'scheduled',
                scoreA: '',
                scoreB: '',
                date: '2024-01-15'
            },
            {
                id: 5,
                teamA: 'Beach Bandits',
                teamB: 'Sand Storm',
                court: 'Court 1',
                time: '9:00 AM',
                status: 'finished',
                scoreA: '21',
                scoreB: '15',
                date: '2024-01-15'
            },
            {
                id: 6,
                teamA: 'Volley Vipers',
                teamB: 'Sunset Strikers',
                court: 'Court 2',
                time: '9:30 AM',
                status: 'finished',
                scoreA: '19',
                scoreB: '21',
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
        
        let scoreSection = '';
        if (status === 'finished') {
            scoreSection = `
                <div class="game-info">
                    <div class="info-item">
                        <strong>Final Score</strong>
                        <div>${game.scoreA} - ${game.scoreB}</div>
                    </div>
                    <div class="info-item">
                        <strong>Winner</strong>
                        <div>${parseInt(game.scoreA) > parseInt(game.scoreB) ? game.teamA : game.teamB}</div>
                    </div>
                </div>
            `;
        } else if (status === 'current') {
            scoreSection = `
                <div class="game-info">
                    <div class="info-item">
                        <strong>Current Score</strong>
                        <div>${game.scoreA || '0'} - ${game.scoreB || '0'}</div>
                    </div>
                    <div class="info-item">
                        <strong>Status</strong>
                        <div>In Progress</div>
                    </div>
                </div>
                <div class="score-input">
                    <input type="number" id="scoreA_${game.id}" placeholder="Team A Score" min="0" max="30" value="${game.scoreA || ''}">
                    <input type="number" id="scoreB_${game.id}" placeholder="Team B Score" min="0" max="30" value="${game.scoreB || ''}">
                    <button class="submit-score" onclick="tournamentManager.submitScore(${game.id})">
                        <i class="fas fa-save"></i> Update Score
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
                        <span>Team A</span>
                    </div>
                    <div class="team team-b">
                        <span>${game.teamB}</span>
                        <span>Team B</span>
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

    async submitScore(gameId) {
        try {
            const scoreA = document.getElementById(`scoreA_${gameId}`).value;
            const scoreB = document.getElementById(`scoreB_${gameId}`).value;
            
            if (!scoreA || !scoreB) {
                alert('Please enter scores for both teams');
                return;
            }
            
            if (parseInt(scoreA) < 0 || parseInt(scoreB) < 0) {
                alert('Scores cannot be negative');
                return;
            }
            
            // Find the game and update it
            const game = this.games.find(g => g.id === gameId);
            if (game) {
                game.scoreA = scoreA;
                game.scoreB = scoreB;
                
                // If both scores are entered, mark as finished
                if (parseInt(scoreA) >= 21 || parseInt(scoreB) >= 21) {
                    game.status = 'finished';
                }
                
                // Re-categorize and re-render
                this.categorizeGames();
                this.renderGames();
                
                // In a real implementation, you'd save this to Google Sheets
                if (this.googleSheetsId && this.googleSheetsId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
                    await this.updateGoogleSheets(gameId, scoreA, scoreB);
                }
                
                alert('Score updated successfully!');
            }
            
        } catch (error) {
            this.showError('Failed to update score: ' + error.message);
        }
    }

    async updateGoogleSheets(gameId, scoreA, scoreB) {
        // This would implement the actual Google Sheets update
        // For now, just log the action
        console.log(`Updating game ${gameId} with scores: ${scoreA} - ${scoreB}`);
        
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
