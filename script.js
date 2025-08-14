// Beach Tournament Manager - JavaScript
class TournamentManager {
    constructor() {
        this.games = [];
        this.googleSheetsId = 'YOUR_GOOGLE_SHEET_ID_HERE';
        this.googleSheetsApiKey = 'YOUR_GOOGLE_SHEETS_API_KEY_HERE';
        this.currentGameIndex = 0;
    }

    async init() {
        try {
            await this.loadTournamentData();
            this.categorizeGames();
            this.renderGames();
            this.hideLoading(); // Hide loading spinner after data loads
        } catch (error) {
            this.showError('Failed to initialize tournament manager: ' + error.message);
            this.hideLoading(); // Hide loading even if there's an error
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
            // 9:45 AM - All 6 courts start simultaneously
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
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'scheduled',
                userConfirmed: false,
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
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'scheduled',
                userConfirmed: false,
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
                status: 'scheduled',
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
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'scheduled',
                userConfirmed: false,
                eventManagerConfirmed: false
            },
            {
                id: 5,
                matchNumber: 5,
                tournament: 'Women',
                gruppe: 'A',
                court: 'Court 5',
                startzeit: '9:45',
                team1: 'Team 3 Gruppe A',
                team2: 'Team 14 Gruppe A',
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'scheduled',
                userConfirmed: false,
                eventManagerConfirmed: false
            },
            {
                id: 6,
                matchNumber: 6,
                tournament: 'Women',
                gruppe: 'B',
                court: 'Court 6',
                startzeit: '9:45',
                team1: 'Team 6 Gruppe B',
                team2: 'Team 11 Gruppe B',
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'scheduled',
                userConfirmed: false,
                eventManagerConfirmed: false
            },
            // 10:30 AM - Next round (4 courts from game 15 onwards)
            {
                id: 7,
                matchNumber: 7,
                tournament: 'Men',
                gruppe: 'A',
                court: 'Court 1',
                startzeit: '10:30',
                team1: 'Team 7 Gruppe A',
                team2: 'Team 10 Gruppe A',
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'scheduled',
                userConfirmed: false,
                eventManagerConfirmed: false
            },
            {
                id: 8,
                matchNumber: 8,
                tournament: 'Men',
                gruppe: 'A',
                court: 'Court 2',
                startzeit: '10:30',
                team1: 'Team 2 Gruppe A',
                team2: 'Team 15 Gruppe A',
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'scheduled',
                userConfirmed: false,
                eventManagerConfirmed: false
            },
            {
                id: 9,
                matchNumber: 9,
                tournament: 'Men',
                gruppe: 'B',
                court: 'Court 3',
                startzeit: '10:30',
                team1: 'Team 1 Gruppe B',
                team2: 'Team 8 Gruppe B',
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'scheduled',
                userConfirmed: false,
                eventManagerConfirmed: false
            },
            {
                id: 10,
                matchNumber: 10,
                tournament: 'Women',
                gruppe: 'A',
                court: 'Court 4',
                startzeit: '10:30',
                team1: 'Team 5 Gruppe A',
                team2: 'Team 12 Gruppe A',
                resultat: '<->',
                dauer: '0:00',
                sets: [
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' },
                    { teamAScore: '', teamBScore: '' }
                ],
                status: 'scheduled',
                userConfirmed: false,
                eventManagerConfirmed: false
            }
        ];
        
        console.log('Demo data loaded:', this.games.length, 'games');
        console.log('Games:', this.games);
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

    categorizeGames() {
        console.log('Categorizing games...');
        
        // Reset all games to scheduled first
        this.games.forEach(game => {
            if (!game.eventManagerConfirmed) {
                game.status = 'scheduled';
            }
        });

        // Find all games that start at the same time (9:45) and make them current
        const currentTimeGames = this.games.filter(g => 
            !g.eventManagerConfirmed && g.startzeit === '9:45'
        );
        
        currentTimeGames.forEach(game => {
            game.status = 'current';
            console.log('Set game', game.id, 'as current (starts at', game.startzeit, ')');
        });

        // Update other games based on confirmation status
        this.games.forEach(game => {
            if (game.eventManagerConfirmed) {
                game.status = 'finished';
            } else if (game.userConfirmed && !game.eventManagerConfirmed) {
                game.status = 'pending_confirmation';
            }
        });
        
        console.log('Games after categorization:');
        this.games.forEach(game => {
            console.log(`Game ${game.id}: ${game.status} (starts at ${game.startzeit})`);
        });
    }

    renderGames() {
        this.renderCurrentGames();
        this.renderNextGames();
        this.renderFinishedGames();
        this.renderPendingConfirmations();
    }

    renderCurrentGames() {
        const container = document.getElementById('currentGames');
        const currentGames = this.games.filter(g => g.status === 'current');
        
        if (currentGames.length === 0) {
            container.innerHTML = '<p>No games currently in progress.</p>';
            return;
        }

        container.innerHTML = currentGames.map(game => this.createGameCard(game)).join('');
    }

    renderNextGames() {
        const container = document.getElementById('nextGames');
        const nextGames = this.games.filter(g => g.status === 'scheduled').slice(0, 6);
        
        if (nextGames.length === 0) {
            container.innerHTML = '<p>No upcoming games scheduled.</p>';
            return;
        }

        container.innerHTML = nextGames.map(game => this.createGameCard(game)).join('');
    }

    renderFinishedGames() {
        const container = document.getElementById('finishedGames');
        const finishedGames = this.games.filter(g => g.status === 'finished');
        
        if (finishedGames.length === 0) {
            container.innerHTML = '<p>No games finished yet.</p>';
            return;
        }

        container.innerHTML = finishedGames.map(game => this.createGameCard(game)).join('');
    }

    renderPendingConfirmations() {
        const container = document.getElementById('pendingConfirmations');
        if (!container) return;
        
        const pendingGames = this.games.filter(g => g.status === 'pending_confirmation');
        
        if (pendingGames.length === 0) {
            container.innerHTML = '<p>No games pending confirmation.</p>';
            return;
        }

        container.innerHTML = pendingGames.map(game => this.createPendingConfirmationCard(game)).join('');
    }

    createGameCard(game) {
        const isCurrent = game.status === 'current';
        const isFinished = game.status === 'finished';
        
        let cardContent = `
            <div class="game-card ${game.status}">
                <div class="game-header">
                    <h3>Match ${game.matchNumber} - ${game.tournament}</h3>
                    <span class="game-status status-${game.status}">${this.getStatusText(game.status)}</span>
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
        `;

        if (isFinished) {
            // Show completed sets
            cardContent += this.createSetsDisplay(game.sets);
            cardContent += `<div class="match-result">${this.getMatchResult(game.sets)}</div>`;
        } else if (isCurrent) {
            // Show set input form
            cardContent += this.createSetInputForm(game);
        }

        cardContent += '</div>';
        return cardContent;
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
                
                ${this.createSetsDisplay(game.sets)}
                
                <div class="confirmation-actions">
                    <button class="btn-edit" onclick="tournamentManager.editGame(${game.id})">
                        <i class="fas fa-edit"></i> Edit Scores
                    </button>
                    <button class="btn-confirm" onclick="tournamentManager.confirmGame(${game.id})">
                        <i class="fas fa-check"></i> Confirm Game
                    </button>
                </div>
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

    createSetInputForm(game) {
        return `
            <div class="set-input-form">
                <h4>Enter Set Scores</h4>
                <div class="set-input-group">
                    <label>SET 1</label>
                    <div class="set-inputs">
                        <input type="number" id="set1_scoreA_${game.id}" placeholder="Team A" min="0" max="30">
                        <span class="set-separator">-</span>
                        <input type="number" id="set1_scoreB_${game.id}" placeholder="Team B" min="0" max="30">
                    </div>
                </div>
                
                <div class="set-input-group">
                    <label>SET 2</label>
                    <div class="set-inputs">
                        <input type="number" id="set2_scoreA_${game.id}" placeholder="Team A" min="0" max="30">
                        <span class="set-separator">-</span>
                        <input type="number" id="set2_scoreB_${game.id}" placeholder="Team B" min="0" max="30">
                    </div>
                </div>
                
                <div class="set-input-group" id="set3_group_${game.id}" style="display: none;">
                    <label>SET 3 (if needed)</label>
                    <div class="set-inputs">
                        <input type="number" id="set3_scoreA_${game.id}" placeholder="Team A" min="0" max="20">
                        <span class="set-separator">-</span>
                        <input type="number" id="set3_scoreB_${game.id}" placeholder="Team B" min="0" max="20">
                    </div>
                </div>
                
                <button class="submit-score" onclick="tournamentManager.finishGame(${game.id})">
                    <i class="fas fa-flag-checkered"></i> Finish Game
                </button>
            </div>
        `;
    }

    formatTeamName(teamName) {
        // Extract last names from team name (e.g., "Team 1 Gruppe A" -> "Team 1")
        const parts = teamName.split(' ');
        if (parts.length >= 2) {
            return `${parts[0]} ${parts[1]}`;
        }
        return teamName;
    }

    getStatusText(status) {
        switch (status) {
            case 'current': return 'In Progress';
            case 'scheduled': return 'Scheduled';
            case 'finished': return 'Finished';
            case 'pending_confirmation': return 'Pending Confirmation';
            default: return status;
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

    async finishGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        // Validate set scores
        const set1A = document.getElementById(`set1_scoreA_${gameId}`).value;
        const set1B = document.getElementById(`set1_scoreB_${gameId}`).value;
        const set2A = document.getElementById(`set2_scoreA_${gameId}`).value;
        const set2B = document.getElementById(`set2_scoreB_${gameId}`).value;
        const set3A = document.getElementById(`set3_scoreA_${gameId}`).value;
        const set3B = document.getElementById(`set3_scoreB_${gameId}`).value;

        // Basic validation
        if (!set1A || !set1B || !set2A || !set2B) {
            alert('Please fill in at least the first two sets.');
            return;
        }

        // Update game with scores
        game.sets[0] = { teamAScore: set1A, teamBScore: set1B };
        game.sets[1] = { teamAScore: set2A, teamBScore: set2B };
        if (set3A && set3B) {
            game.sets[2] = { teamAScore: set3A, teamBScore: set3B };
        }

        // Mark as user confirmed
        game.userConfirmed = true;
        game.status = 'pending_confirmation';

        // Update display
        this.categorizeGames();
        this.renderGames();

        // Update Google Sheets if configured
        if (this.googleSheetsId && this.googleSheetsId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
            await this.updateGoogleSheets(gameId);
        }

        alert('Game finished! Waiting for event manager confirmation.');
    }

    editGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        // Reset confirmation status
        game.userConfirmed = false;
        game.status = 'current';

        // Update display
        this.categorizeGames();
        this.renderGames();

        alert('Game reopened for editing.');
    }

    confirmGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        // Mark as event manager confirmed
        game.eventManagerConfirmed = true;
        game.status = 'finished';

        // Update display
        this.categorizeGames();
        this.renderGames();

        // Update Google Sheets if configured
        if (this.googleSheetsId && this.googleSheetsId !== 'YOUR_GOOGLE_SHEET_ID_HERE') {
            this.updateGoogleSheets(gameId);
        }

        alert('Game confirmed and closed!');
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
            resultat: this.getMatchResult(game.sets),
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
        }
        console.error(message);
    }

    hideError() {
        const errorDiv = document.getElementById('error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
    }

    showLoading() {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.style.display = 'block';
        }
    }
}

// Global tournament manager instance
let tournamentManager;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    tournamentManager = new TournamentManager();
    tournamentManager.init();
});

// Global refresh function
function refreshData() {
    if (tournamentManager) {
        tournamentManager.hideError();
        tournamentManager.showLoading();
        tournamentManager.loadTournamentData();
    }
}

