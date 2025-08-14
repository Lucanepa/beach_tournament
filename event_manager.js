class EventManager {
    constructor() {
        this.games = [];
        this.googleSheetsId = 'YOUR_GOOGLE_SHEET_ID_HERE';
        this.googleSheetsApiKey = 'YOUR_GOOGLE_SHEETS_API_KEY_HERE';
    }

    async init() {
        try {
            await this.loadTournamentData();
            this.updateOverview();
            this.renderGames();
        } catch (error) {
            this.showError('Failed to initialize event manager: ' + error.message);
        }
    }

    async loadTournamentData() {
        try {
            if (this.googleSheetsId && this.googleSheetsId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
                await this.loadFromGoogleSheets();
            } else {
                this.loadDemoData();
            }
        } catch (error) {
            this.showError('Failed to load tournament data: ' + error.message);
            this.loadDemoData(); // Fallback to demo data
        }
    }

    loadDemoData() {
        this.games = [
            {
                id: 1,
                matchNumber: 1,
                tournament: 'Men',
                gruppe: 'A',
                court: 'Court 1',
                startzeit: '9:45',
                team1: 'Team 1 Gruppe A',
                team2: 'Team 16 Gruppe A',
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '21', teamBScore: '19' },
                    { teamAScore: '18', teamBScore: '21' },
                    { teamAScore: '15', teamBScore: '13' }
                ],
                status: 'pending_confirmation',
                userConfirmed: true,
                eventManagerConfirmed: false
            },
            {
                id: 2,
                matchNumber: 2,
                tournament: 'Men',
                gruppe: 'A',
                court: 'Court 2',
                startzeit: '9:45',
                team1: 'Team 8 Gruppe A',
                team2: 'Team 9 Gruppe A',
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '21', teamBScore: '18' },
                    { teamAScore: '21', teamBScore: '19' }
                ],
                status: 'pending_confirmation',
                userConfirmed: true,
                eventManagerConfirmed: false
            },
            {
                id: 3,
                matchNumber: 3,
                tournament: 'Men',
                gruppe: 'B',
                court: 'Court 3',
                startzeit: '9:45',
                team1: 'Team 5 Gruppe B',
                team2: 'Team 12 Gruppe B',
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'current',
                userConfirmed: false,
                eventManagerConfirmed: false
            },
            {
                id: 4,
                matchNumber: 4,
                tournament: 'Women',
                gruppe: 'A',
                court: 'Court 4',
                startzeit: '9:45',
                team1: 'Team 4 Gruppe A',
                team2: 'Team 13 Gruppe A',
                resultat: 'Team A wins 2-1',
                dauer: '45:00',
                sets: [
                    { teamAScore: '21', teamBScore: '19' },
                    { teamAScore: '18', teamBScore: '21' },
                    { teamAScore: '15', teamBScore: '13' }
                ],
                status: 'finished',
                userConfirmed: true,
                eventManagerConfirmed: true
            }
        ];
    }

    async loadFromGoogleSheets() {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.googleSheetsId}/values/Sheet1!A:N?key=${this.googleSheetsApiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 1) {
            this.games = [];
            for (let i = 1; i < data.values.length; i++) {
                const row = data.values[i];
                const game = {
                    id: i,
                    matchNumber: row[0] || i,
                    tournament: row[1] || 'Men',
                    gruppe: row[2] || 'A',
                    court: row[3] || 'Court 1',
                    startzeit: row[4] || '9:45',
                    team1: row[5] || 'Team 1',
                    team2: row[6] || 'Team 2',
                    resultat: row[7] || '<->',
                    dauer: row[8] || '0:00',
                    sets: [
                        { teamAScore: row[9] || '', teamBScore: row[10] || '' },
                        { teamAScore: row[11] || '', teamBScore: row[12] || '' },
                        { teamAScore: row[13] || '', teamBScore: row[14] || '' }
                ],
                    status: 'scheduled',
                    userConfirmed: false,
                    eventManagerConfirmed: false
                };
                this.games.push(game);
            }
        }
    }

    updateOverview() {
        const totalGames = this.games.length;
        const currentGames = this.games.filter(g => g.status === 'current').length;
        const pendingConfirmations = this.games.filter(g => g.status === 'pending_confirmation').length;
        const finishedGames = this.games.filter(g => g.status === 'finished').length;

        document.getElementById('totalGames').textContent = totalGames;
        document.getElementById('currentGames').textContent = currentGames;
        document.getElementById('pendingConfirmations').textContent = pendingConfirmations;
        document.getElementById('finishedGames').textContent = finishedGames;
    }

    renderGames() {
        this.renderPendingConfirmations();
        this.renderCurrentGames();
        this.renderRecentFinished();
    }

    renderPendingConfirmations() {
        const container = document.getElementById('pendingConfirmations');
        const pendingGames = this.games.filter(g => g.status === 'pending_confirmation');
        
        if (pendingGames.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #ecf0f1; font-style: italic;">No games pending confirmation.</p>';
            return;
        }

        container.innerHTML = pendingGames.map(game => this.createPendingConfirmationCard(game)).join('');
    }

    renderCurrentGames() {
        const container = document.getElementById('currentGames');
        const currentGames = this.games.filter(g => g.status === 'current');
        
        if (currentGames.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #ecf0f1; font-style: italic;">No games currently in progress.</p>';
            return;
        }

        container.innerHTML = currentGames.map(game => this.createCurrentGameCard(game)).join('');
    }

    renderRecentFinished() {
        const container = document.getElementById('recentFinished');
        const finishedGames = this.games.filter(g => g.status === 'finished').slice(0, 6);
        
        if (finishedGames.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #ecf0f1; font-style: italic;">No games completed yet.</p>';
            return;
        }

        container.innerHTML = finishedGames.map(game => this.createFinishedGameCard(game)).join('');
    }

    createPendingConfirmationCard(game) {
        return `
            <div class="game-card pending-confirmation">
                <div class="game-header">
                    <h3>Match ${game.matchNumber} - ${game.tournament}</h3>
                    <span class="game-status status-pending">Pending Confirmation</span>
                </div>
                
                <div class="teams">
                    <div class="team team-a">
                        <span class="team-name">${this.formatTeamName(game.team1)}</span>
                        <span class="team-score">TEAM A</span>
                    </div>
                    <div class="team team-b">
                        <span class="team-name">${this.formatTeamName(game.team2)}</span>
                        <span class="team-score">TEAM B</span>
                    </div>
                </div>
                
                <div class="game-info">
                    <div class="info-item">
                        <strong>Court</strong>
                        <span>${game.court}</span>
                    </div>
                    <div class="info-item">
                        <strong>Time</strong>
                        <span>${game.startzeit}</span>
                    </div>
                    <div class="info-item">
                        <strong>Group</strong>
                        <span>${game.gruppe}</span>
                    </div>
                    <div class="info-item">
                        <strong>Duration</strong>
                        <span>${game.dauer}</span>
                    </div>
                </div>
                
                ${this.createSetsDisplay(game.sets)}
                
                <div class="confirmation-actions">
                    <button class="btn-edit" onclick="eventManager.reopenGame(${game.id})">
                        <i class="fas fa-edit"></i> Reopen
                    </button>
                    <button class="btn-reject" onclick="eventManager.rejectGame(${game.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn-confirm" onclick="eventManager.confirmGame(${game.id})">
                        <i class="fas fa-check"></i> Confirm
                    </button>
                </div>
            </div>
        `;
    }

    createCurrentGameCard(game) {
        return `
            <div class="game-card current">
                <div class="game-header">
                    <h3>Match ${game.matchNumber} - ${game.tournament}</h3>
                    <span class="game-status status-current">In Progress</span>
                </div>
                
                <div class="teams">
                    <div class="team team-a">
                        <span class="team-name">${this.formatTeamName(game.team1)}</span>
                        <span class="team-score">TEAM A</span>
                    </div>
                    <div class="team team-b">
                        <span class="team-name">${this.formatTeamName(game.team2)}</span>
                        <span class="team-score">TEAM B</span>
                    </div>
                </div>
                
                <div class="game-info">
                    <div class="info-item">
                        <strong>Court</strong>
                        <span>${game.court}</span>
                    </div>
                    <div class="info-item">
                        <strong>Time</strong>
                        <span>${game.startzeit}</span>
                    </div>
                    <div class="info-item">
                        <strong>Group</strong>
                        <span>${game.gruppe}</span>
                    </div>
                    <div class="info-item">
                        <strong>Status</strong>
                        <span>Waiting for scores</span>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #ecf0f1; font-style: italic;">
                    <i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Game in progress - waiting for staff to enter scores</p>
                </div>
            </div>
        `;
    }

    createFinishedGameCard(game) {
        return `
            <div class="game-card">
                <div class="game-header">
                    <h3>Match ${game.matchNumber} - ${game.tournament}</h3>
                    <span class="game-status status-finished">Completed</span>
                </div>
                
                <div class="teams">
                    <div class="team team-a">
                        <span class="team-name">${this.formatTeamName(game.team1)}</span>
                        <span class="team-score">TEAM A</span>
                    </div>
                    <div class="team team-b">
                        <span class="team-name">${this.formatTeamName(game.team2)}</span>
                        <span class="team-score">TEAM B</span>
                    </div>
                </div>
                
                <div class="game-info">
                    <div class="info-item">
                        <strong>Court</strong>
                        <span>${game.court}</span>
                    </div>
                    <div class="info-item">
                        <strong>Duration</strong>
                        <span>${game.dauer}</span>
                    </div>
                </div>
                
                ${this.createSetsDisplay(game.sets)}
                
                <div class="match-result">${game.resultat}</div>
            </div>
        `;
    }

    createSetsDisplay(sets) {
        let setsHtml = '<div class="sets-display">';
        sets.forEach((set, index) => {
            if (set.teamAScore !== '' && set.teamBScore !== '') {
                setsHtml += `
                    <div class="set-row">
                        <span class="set-label">SET ${index + 1}</span>
                        <span class="set-score">${set.teamAScore} - ${set.teamBScore}</span>
                    </div>
                `;
            }
        });
        setsHtml += '</div>';
        return setsHtml;
    }

    formatTeamName(teamName) {
        const parts = teamName.split(' ');
        if (parts.length >= 2) {
            return `${parts[0]} ${parts[1]}`;
        }
        return teamName;
    }

    async confirmGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        try {
            // Mark as event manager confirmed
            game.eventManagerConfirmed = true;
            game.status = 'finished';
            game.resultat = this.getMatchResult(game.sets);
            game.dauer = '45:00'; // Assuming 45 minutes per game

            // Update display
            this.updateOverview();
            this.renderGames();

            // Update Google Sheets if configured
            if (this.googleSheetsId && this.googleSheetsId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
                await this.updateGoogleSheets(gameId);
            }

            this.showSuccess(`Match ${game.matchNumber} confirmed and closed successfully!`);
            
            // Auto-refresh after a short delay to show the updated state
            setTimeout(() => {
                this.loadTournamentData();
                this.updateOverview();
                this.renderGames();
            }, 1000);

        } catch (error) {
            this.showError('Failed to confirm game: ' + error.message);
        }
    }

    async rejectGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        const reason = prompt('Please provide a reason for rejecting this game:');
        if (!reason) return;

        try {
            // Reset confirmation status
            game.userConfirmed = false;
            game.status = 'current';

            // Update display
            this.updateOverview();
            this.renderGames();

            // Update Google Sheets if configured
            if (this.googleSheetsId && this.googleSheetsId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
                await this.updateGoogleSheets(gameId);
            }

            this.showSuccess(`Match ${game.matchNumber} rejected and reopened for editing. Reason: ${reason}`);

        } catch (error) {
            this.showError('Failed to reject game: ' + error.message);
        }
    }

    async reopenGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        try {
            // Reset confirmation status
            game.userConfirmed = false;
            game.status = 'current';

            // Update display
            this.updateOverview();
            this.renderGames();

            // Update Google Sheets if configured
            if (this.googleSheetsId && this.googleSheetsId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
                await this.updateGoogleSheets(gameId);
            }

            this.showSuccess(`Match ${game.matchNumber} reopened for editing.`);

        } catch (error) {
            this.showError('Failed to reopen game: ' + error.message);
        }
    }

    getMatchResult(sets) {
        const teamAWins = sets.filter(set => 
            set.teamAScore !== '' && set.teamBScore !== '' && 
            parseInt(set.teamAScore) > parseInt(set.teamBScore)
        ).length;
        const teamBWins = sets.filter(set => 
            set.teamAScore !== '' && set.teamBScore !== '' && 
            parseInt(set.teamBScore) > parseInt(set.teamAScore)
        ).length;
        
        if (teamAWins > teamBWins) {
            return `Team A wins ${teamAWins}-${teamBWins}`;
        } else if (teamBWins > teamAWins) {
            return `Team B wins ${teamBWins}-${teamAWins}`;
        } else {
            return 'Match tied';
        }
    }

    async updateGoogleSheets(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        // This is a placeholder - you'll need to implement the actual Google Sheets API call
        console.log('Updating Google Sheets for game:', gameId, game);
        
        // Example of what you'd send to Google Sheets:
        const updateData = {
            matchNumber: game.matchNumber,
            tournament: game.tournament,
            gruppe: game.gruppe,
            court: game.court,
            startzeit: game.startzeit,
            team1: game.team1,
            team2: game.team2,
            resultat: game.resultat,
            dauer: game.dauer,
            set1ScoreA: game.sets[0].teamAScore,
            set1ScoreB: game.sets[0].teamBScore,
            set2ScoreA: game.sets[1].teamAScore,
            set2ScoreB: game.sets[1].teamBScore,
            set3ScoreA: game.sets[2]?.teamAScore || '',
            set3ScoreB: game.sets[2]?.teamBScore || ''
        };
        
        console.log('Data to update:', updateData);
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
        console.error(message);
    }

    showSuccess(message) {
        const successDiv = document.getElementById('success');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        }
        console.log(message);
    }

    hideMessages() {
        const errorDiv = document.getElementById('error');
        const successDiv = document.getElementById('success');
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }
}

// Global event manager instance
let eventManager;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    eventManager = new EventManager();
    eventManager.init();
});

// Global refresh function
function refreshData() {
    if (eventManager) {
        eventManager.hideMessages();
        eventManager.loadTournamentData();
    }
}
