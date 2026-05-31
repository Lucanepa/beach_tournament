// Beach Volleyball Tournament Management System
// Reads Excel data directly using SheetJS

// === Data source configuration =============================================
// By default the app reads the bundled .xlsx files next to this script.
//
// To read a LIVE Google Sheet instead (edits show up within seconds, no
// re-deploy needed):
//   1. In Google Sheets: File > Share > "Anyone with the link" > Viewer.
//   2. Copy the spreadsheet ID from its URL — the long part between /d/ and /edit:
//        https://docs.google.com/spreadsheets/d/<THIS_IS_THE_ID>/edit
//   3. Paste it as googleId below. The sheet must contain the same tabs the
//      parser expects: "Anmeldung", "Match" (or "Resultate") and "Rangliste".
//
// Leave googleId as null to keep using the local file.
//
// `label` is what shows in the tournament dropdown. For a new tournament you
// only edit this block — e.g. swap to U20M / U20F by changing googleId (or
// localFile) and label. The internal keys "men"/"women" can stay as-is; they
// are just slots for the first and second tournament.
// `label` may be a plain string (shown as-is) or a { de, en } object so the
// dropdown follows the selected language.
const DATA_SOURCES = {
    men:   { googleId: '1iTfEsqh3IfRWuk-ajwDwyPvAP7wJvIUVLUpvcH-qawM', localFile: 'b2m.xlsx', label: { de: 'U20 Herren (U20M)', en: 'U20 Men (U20M)' } },
    women: { googleId: '1yrTfHietiohzpGIVlMJIjzZoNoNeme1sZTdXG50JX4c', localFile: 'b3f.xlsx', label: { de: 'U20 Damen (U20F)', en: 'U20 Women (U20F)' } },
};

// Resolve a DATA_SOURCES label (string or { de, en }) for the current language.
function tournamentLabel(key) {
    const raw = DATA_SOURCES[key] && DATA_SOURCES[key].label;
    if (raw && typeof raw === 'object') {
        const lang = (typeof getLang === 'function') ? getLang() : 'de';
        return raw[lang] || raw.de || key;
    }
    return raw || key;
}

// Populate a tournament <select> from DATA_SOURCES so labels live in one place.
function populateTournamentFilter() {
    const select = document.getElementById('tournamentFilter');
    if (!select) return;
    const current = select.value || 'men';
    select.innerHTML = Object.keys(DATA_SOURCES).map(key => {
        const label = tournamentLabel(key);
        return `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`;
    }).join('');
    // Preserve the previously selected tournament if it still exists
    if ([...select.options].some(o => o.value === current)) {
        select.value = current;
    }
}

// Build the URL to fetch a tournament's workbook, with optional cache-busting.
function buildDataUrl(tournament, bust) {
    const src = DATA_SOURCES[tournament] || DATA_SOURCES.men;
    const cb = bust ? `cb=${Date.now()}` : '';
    if (src.googleId) {
        // Google's export endpoint always returns the full, live workbook.
        return `https://docs.google.com/spreadsheets/d/${src.googleId}/export?format=xlsx${cb ? `&${cb}` : ''}`;
    }
    return cb ? `${src.localFile}?${cb}` : src.localFile;
}

class TournamentManager {
    constructor() {
        this.teams = [];
        this.matches = [];
        this.courts = [];
        this.lastModified = null;
        this.refreshInterval = null;
        this.currentTournament = 'men'; // 'men' or 'women'
        this.menData = { teams: [], matches: [], courts: [] };
        this.womenData = { teams: [], matches: [], courts: [] };
    }

    // Initialize the tournament data
    async init() {
        try {
            await this.loadExcelData();
            this.updateLastUpdatedTime();
            this.startAutoRefresh();
        } catch (error) {
            console.error('Error initializing tournament:', error);
            this.showError(t('error.loadData'));
        }
    }

    // Start auto-refresh to detect data changes
    startAutoRefresh() {
        // Check for changes every 10 seconds (each check re-downloads the workbook)
        this.refreshInterval = setInterval(async () => {
            try {
                await this.checkForUpdates();
            } catch (error) {
            }
        }, 10000);

    }

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    // Check if the underlying data has changed (works for both local files and
    // Google Sheets, which don't expose a reliable Last-Modified header).
    async checkForUpdates() {
        try {
            // Re-fetch and re-parse the data (cache-busted), then compare a
            // signature of the parsed matches to detect real changes.
            await this.loadExcelData(true);

            const signature = JSON.stringify({
                men: this.menData.matches,
                women: this.womenData.matches
            });

            if (this.dataSignature && signature !== this.dataSignature) {
                this.refreshDisplay();
            }
            this.dataSignature = signature;
        } catch (error) {
            // Data might be temporarily unreachable, ignore silently
        }
    }

    // Refresh the display after data update
    refreshDisplay() {
        // Show refresh indicator
        this.showRefreshIndicator();
        
        // Update last updated timestamp
        this.updateLastUpdatedTime();
        
        // Trigger a custom event that pages can listen to
        const event = new CustomEvent('tournamentDataUpdated', {
            detail: {
                teams: this.teams,
                matches: this.matches,
                courts: this.courts
            }
        });
        document.dispatchEvent(event);
        
    }

    // Update the last updated timestamp
    updateLastUpdatedTime() {
        const now = new Date();
        const timeString = now.toLocaleString('de-CH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Update or create the last updated element
        let lastUpdatedElement = document.getElementById('last-updated');
        if (!lastUpdatedElement) {
            lastUpdatedElement = document.createElement('div');
            lastUpdatedElement.id = 'last-updated';
            lastUpdatedElement.style.cssText = `
                position: fixed;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(22, 35, 63, 0.92);
                color: white;
                padding: 8px 16px;
                border-radius: 9999px;
                font-size: 12px;
                font-weight: 500;
                z-index: 1000;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            `;
            document.body.appendChild(lastUpdatedElement);
        }

        lastUpdatedElement.innerHTML = `<i class="fas fa-clock"></i> ${t('updated.prefix')} ${timeString}`;
    }

    // Show a small refresh indicator
    showRefreshIndicator() {
        // Create or update refresh indicator
        let indicator = document.getElementById('refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'refresh-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef5a45;
                color: white;
                padding: 8px 16px;
                border-radius: 9999px;
                font-size: 14px;
                font-weight: 600;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(239, 90, 69, 0.35);
                display: flex;
                align-items: center;
                gap: 8px;
            `;
            document.body.appendChild(indicator);
        }

        indicator.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> ${t('updated.toast')}`;
        indicator.style.display = 'flex';
        
        // Hide after 3 seconds
        setTimeout(() => {
            if (indicator) {
                indicator.style.display = 'none';
            }
        }, 3000);
    }

    // Load data directly from Excel file
    async loadExcelData(forceRefresh = false) {
        try {
            
            // Load SheetJS library if not already loaded
            if (typeof XLSX === 'undefined') {
                await this.loadSheetJS();
            }
            
            // Load men's tournament data with cache busting
            await this.loadTournamentData('men', 'b2m.xlsx', forceRefresh);
            
            // Load women's tournament data with cache busting
            await this.loadTournamentData('women', 'b3f.xlsx', forceRefresh);
            
            // Set current data based on current tournament
            this.setCurrentTournament(this.currentTournament);
            
        } catch (error) {
            console.error('Error loading Excel file:', error);
            // Use fallback data
            this.teams = this.getFallbackTeams();
            this.matches = this.getFallbackMatches();
            this.courts = ['Court 1', 'Court 2'];
        }
    }
    
    // Load data for a specific tournament
    async loadTournamentData(tournament, filename, forceRefresh = false) {
        try {
            // Resolve the source (local file or live Google Sheet) with cache busting.
            // No custom request headers, so cross-origin Google fetches don't trigger
            // a CORS preflight.
            const url = buildDataUrl(tournament, forceRefresh);
            const response = await fetch(url, {
                cache: forceRefresh ? 'no-store' : 'default'
            });
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            let teams = [];
            let matches = [];
            
            // Load teams from Anmeldung sheet
            if (workbook.Sheets['Anmeldung']) {
                teams = this.parseTeamsFromSheet(workbook.Sheets['Anmeldung']);
            }
            
            // Load matches from the normalized "Match" sheet (preferred) or, when it
            // doesn't exist (e.g. live Google Sheets), the raw "Resultate" sheet.
            // Each layout has a different column arrangement.
            if (workbook.Sheets['Match']) {
                matches = this.parseMatchesFromSheet(workbook.Sheets['Match'], tournament, 'match');
            } else if (workbook.Sheets['Resultate']) {
                matches = this.parseMatchesFromSheet(workbook.Sheets['Resultate'], tournament, 'resultate');
            } else {
            }
            
            // Get unique courts
            const courts = [...new Set(matches.map(match => match.court).filter(court => court && court !== 'TBD'))];
            
            
            // Store data
            if (tournament === 'men') {
                this.menData = { teams, matches, courts };
            } else {
                this.womenData = { teams, matches, courts };
            }
            
        } catch (error) {
            console.error(`Error loading ${tournament} tournament:`, error);
        }
    }
    
    // Set current tournament and update data
    setCurrentTournament(tournament) {
        this.currentTournament = tournament;
        const data = tournament === 'men' ? this.menData : this.womenData;
        this.teams = data.teams;
        this.matches = data.matches;
        this.courts = data.courts;
    }
    
    // Switch tournament
    switchTournament(tournament) {
        this.setCurrentTournament(tournament);
        this.updateLastUpdatedTime();
        document.dispatchEvent(new CustomEvent('tournamentDataUpdated'));
    }

    // Manual refresh function that clears cache and reloads data
    async manualRefresh() {
        try {
            console.log('Manual refresh initiated...');
            
            // Show loading indicator
            this.showRefreshIndicator();
            
            // Force refresh with cache busting
            await this.loadExcelData(true);
            
            // Update last modified time
            this.updateLastUpdatedTime();
            
            // Refresh display
            this.refreshDisplay();
            
            console.log('Manual refresh completed');
            
        } catch (error) {
            console.error('Error during manual refresh:', error);
            this.showError(t('error.refreshData'));
        }
    }

    // Load SheetJS library dynamically
    async loadSheetJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Parse teams from Anmeldung sheet
    parseTeamsFromSheet(sheet) {
        const teams = [];
        const range = XLSX.utils.decode_range(sheet['!ref']);
        
        for (let row = 1; row <= range.e.r; row++) {
            const seed = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })]?.v;
            const player1 = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })]?.v;
            const firstName1 = sheet[XLSX.utils.encode_cell({ r: row, c: 2 })]?.v;
            const player2 = sheet[XLSX.utils.encode_cell({ r: row, c: 4 })]?.v; // Column E
            const firstName2 = sheet[XLSX.utils.encode_cell({ r: row, c: 5 })]?.v; // Column F
            const teamName = sheet[XLSX.utils.encode_cell({ r: row, c: 8 })]?.v; // Column I
            
            // Skip empty rows
            if (!player1 && !player2) continue;
            
            teams.push({
                id: `team_${row}`,
                seed: seed || row,
                teamName: teamName || `Team ${row}`,
                player1: player1 || '',
                firstName1: firstName1 || '',
                player2: player2 || '',
                firstName2: firstName2 || ''
            });
        }
        
        return teams;
    }

    // Parse matches from either the normalized "Match" sheet or the raw "Resultate" sheet.
    // The two layouts differ: "Resultate" has a "vs" separator column (so Team 2, Result
    // and the set scores are shifted), and it has no status/sex columns (those are derived).
    parseMatchesFromSheet(sheet, tournament = 'men', layout = 'match') {
        const matches = [];
        const range = XLSX.utils.decode_range(sheet['!ref']);

        // Column index map per layout (0-indexed). null = column not present.
        const COLS = {
            match: {
                matchNumber: 0, round: 1, court: 2, time: 3, team1: 4, team2: 5,
                result: 6, resultTeam2: 7,
                set1Team1: 9, set1Team2: 10, set2Team1: 11, set2Team2: 12, set3Team1: 13, set3Team2: 14,
                status: 17, sex: 18
            },
            resultate: {
                matchNumber: 0, round: 1, court: 2, time: 3, team1: 4, team2: 6,
                result: 7, resultTeam2: 9,
                set1Team1: 11, set1Team2: 13, set2Team1: 14, set2Team2: 16, set3Team1: 17, set3Team2: 19,
                status: null, sex: null
            }
        };
        const map = COLS[layout] || COLS.match;
        const cell = (row, key) => (map[key] === null || map[key] === undefined)
            ? undefined
            : sheet[XLSX.utils.encode_cell({ r: row, c: map[key] })]?.v;

        for (let row = 1; row <= range.e.r; row++) {
            const matchNumber = cell(row, 'matchNumber');
            const round = cell(row, 'round');
            const court = cell(row, 'court');
            const time = cell(row, 'time');
            const team1 = cell(row, 'team1');
            const team2 = cell(row, 'team2');
            const result = cell(row, 'result');           // sets won by Team 1
            const resultTeam2 = cell(row, 'resultTeam2');  // sets won by Team 2
            const status = cell(row, 'status');
            const sex = cell(row, 'sex');

            // Get detailed scores from the set columns
            const set1Team1 = cell(row, 'set1Team1');
            const set1Team2 = cell(row, 'set1Team2');
            const set2Team1 = cell(row, 'set2Team1');
            const set2Team2 = cell(row, 'set2Team2');
            const set3Team1 = cell(row, 'set3Team1');
            const set3Team2 = cell(row, 'set3Team2');

            // Build detailed score string
            let fullScore = '';
            if ((set1Team1 || set1Team2) && (set1Team1 != 0 || set1Team2 != 0)) {
                fullScore += `${set1Team1} ${set1Team2}`;
            }
            if ((set2Team1 || set2Team2) && (set2Team1 != 0 || set2Team2 != 0)) {
                fullScore += (fullScore ? ' ' : '') + `${set2Team1} ${set2Team2}`;
            }
            if ((set3Team1 || set3Team2) && (set3Team1 != 0 || set3Team2 != 0)) {
                fullScore += (fullScore ? ' ' : '') + `${set3Team1} ${set3Team2}`;
            }
            
            // Skip only genuinely empty rows. A match is kept even if it has no court
            // assigned yet (court shows as "TBD") so the bracket and full schedule
            // still list it with real team names.
            const isBlank = v => v === undefined || v === null || String(v).trim() === '';
            if (isBlank(team1) && isBlank(team2) && isBlank(matchNumber)) {
                continue;
            }
            
             
             // Format court as "Court X" if it's a number, or "TBD" for Court 0
             let courtFormatted = 'TBD';
             if (court !== null && court !== undefined && court !== '') {
                 if (court === 0) {
                     courtFormatted = 'TBD'; // Court 0 means no specific court assigned
                 } else {
                     courtFormatted = `Court ${court}`;
                 }
             }
             
             // Format time - handle different Excel time formats
             let timeFormatted = 'TBD';
             if (time !== null && time !== undefined && time !== '') {
                 if (typeof time === 'number') {
                     // Excel time as decimal (0.4 = 9:36 AM)
                     const hours = Math.floor(time * 24);
                     const minutes = Math.round((time * 24 - hours) * 60);
                     timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                 } else {
                     // Already a string or other format
                     timeFormatted = String(time);
                 }
             }
            
            
            // Skip matches with blank status only for index page, not for tableau
            // For tableau, we want to show all matches regardless of status
            
            // A match counts as played once any set score or sets-won total is recorded.
            const hasResult = (fullScore.trim() !== '') ||
                (result !== undefined && result !== null && result !== '' && result != 0) ||
                (resultTeam2 !== undefined && resultTeam2 !== null && resultTeam2 !== '' && resultTeam2 != 0);

            // Determine status. The "Match" sheet carries an explicit status column;
            // the raw "Resultate" sheet does not, so we derive it (and the per-court
            // pass below promotes the earliest unplayed match to "open"/current).
            let matchStatus = 'upcoming';
            if (status && status.toString().trim() !== '') {
                const statusStr = status.toString().trim().toLowerCase();
                if (statusStr === 'completed') {
                    matchStatus = 'concluded';
                } else if (statusStr === 'in_progress') {
                    matchStatus = 'open';
                } else if (statusStr.startsWith('upcoming_')) {
                    matchStatus = 'upcoming';
                } else {
                    matchStatus = 'upcoming'; // Default for unknown statuses
                }
            } else if (hasResult) {
                matchStatus = 'concluded';
            } else {
                matchStatus = 'upcoming';
            }
            
            matches.push({
                id: `match_${round}_${matchNumber}`,
                round: round || 'TBD',
                matchNumber: matchNumber || 0,
                court: courtFormatted,
                time: timeFormatted,
                team1: { teamName: team1 || 'Team 1' },
                team2: { teamName: team2 || 'Team 2' },
                status: matchStatus,
                result: result || fullScore.trim() || null,
                score: fullScore.trim() || null,
                // Authoritative sets-won from the result columns (G/H), used by the bracket
                team1Sets: (result !== undefined && result !== null && result !== '') ? result : null,
                team2Sets: (resultTeam2 !== undefined && resultTeam2 !== null && resultTeam2 !== '') ? resultTeam2 : null,
                sex: sex ? sex.toString().toUpperCase() : (tournament === 'men' ? 'M' : 'F')
            });
        }
        
        // Update status logic: if a game is concluded, next game on same court is upcoming
        const courtGroups = {};
        matches.forEach(match => {
            const courtNum = match.court.replace('Court ', '');
            if (courtNum && courtNum !== 'TBD') {
                if (!courtGroups[courtNum]) {
                    courtGroups[courtNum] = [];
                }
                courtGroups[courtNum].push(match);
            }
        });
        
        // Sort matches by time within each court, then ensure each court has a
        // "current" (open) match: if none is explicitly open, the earliest match
        // that isn't concluded becomes the current one. This drives the index
        // page's "Aktuell / Nächste" display when the source has no status column.
        Object.keys(courtGroups).forEach(court => {
            const group = courtGroups[court];
            group.sort((a, b) => {
                const timeA = a.time || '23:59';
                const timeB = b.time || '23:59';
                return timeA.localeCompare(timeB);
            });

            if (!group.some(m => m.status === 'open')) {
                const current = group.find(m => m.status !== 'concluded');
                if (current) current.status = 'open';
            }
        });

        return matches;
    }

    // Get fallback teams data
    getFallbackTeams() {
        return [
            { id: 'team1', seed: 1, teamName: 'Team 1', player1: 'Player 1', firstName1: 'First 1', player2: 'Player 2', firstName2: 'First 2' },
            { id: 'team2', seed: 2, teamName: 'Team 2', player1: 'Player 3', firstName1: 'First 3', player2: 'Player 4', firstName2: 'First 4' },
            { id: 'team3', seed: 3, teamName: 'Team 3', player1: 'Player 5', firstName1: 'First 5', player2: 'Player 6', firstName2: 'First 6' },
            { id: 'team4', seed: 4, teamName: 'Team 4', player1: 'Player 7', firstName1: 'First 7', player2: 'Player 8', firstName2: 'First 8' }
        ];
    }

    // Get fallback matches data
    getFallbackMatches() {
        return [
            {
                id: 'match_Round I_1',
                round: 'Round I',
                matchNumber: 1,
                team1: { teamName: 'Team 1' },
                team2: { teamName: 'Team 2' },
                court: 'Court 1',
                time: '09:00',
                status: 'upcoming',
                result: null
            },
            {
                id: 'match_Round I_2',
                round: 'Round I',
                matchNumber: 2,
                team1: { teamName: 'Team 3' },
                team2: { teamName: 'Team 4' },
                court: 'Court 2',
                time: '10:00',
                status: 'upcoming',
                result: null
            }
        ];
    }

    // Get next games for a specific team or all teams
    getNextGames(teamFilter = '') {
        const now = new Date();
        return this.matches.filter(match => {
            const isUpcoming = match.status === 'upcoming' && 
                              new Date(`2025-09-20T${match.time}`) > now;
            
            if (teamFilter) {
                return isUpcoming && (
                    match.team1?.teamName.toLowerCase().includes(teamFilter.toLowerCase()) ||
                    match.team2?.teamName.toLowerCase().includes(teamFilter.toLowerCase())
                );
            }
            
            return isUpcoming;
        }).sort((a, b) => a.time.localeCompare(b.time));
    }

    // Get in-progress matches
    getInProgressMatches() {
        const now = new Date();
        return this.matches.filter(match => {
            const matchTime = new Date(`2025-09-20T${match.time}`);
            return !match.result && matchTime <= now && matchTime > new Date(now.getTime() - 2 * 60 * 60 * 1000);
        }).sort((a, b) => a.time.localeCompare(b.time));
    }

    // Get completed matches
    getCompletedMatches() {
        return this.matches.filter(match => match.result !== null)
                          .sort((a, b) => b.time.localeCompare(a.time));
    }

    // Get all matches
    getAllMatches() {
        return this.matches.sort((a, b) => a.time.localeCompare(b.time));
    }

    // Show error message
    showError(message) {
        console.error(message);
        // You could implement a toast notification here
    }
}

// Escape text before inserting it into HTML via innerHTML
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Initialize tournament manager
const tournament = new TournamentManager();

// Load index page with courts view
async function loadIndexPage() {
    const loading = document.getElementById('loading');
    const courtsSection = document.getElementById('courtsSection');
    const noMatches = document.getElementById('noMatches');
    const courtsGrid = document.getElementById('courtsGrid');

    try {
        loading.style.display = 'block';
        courtsSection.style.display = 'none';
        noMatches.style.display = 'none';

        await tournament.init();
        
        // Show courts with current and next matches
        displayCourts(courtsGrid);
        courtsSection.style.display = 'block';
        
        // Listen for data updates
        document.addEventListener('tournamentDataUpdated', () => {
            displayCourts(courtsGrid);
        });
        
    } catch (error) {
        console.error('Error loading index page:', error);
        noMatches.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Display courts with current and next matches
function displayCourts(container) {
    container.innerHTML = '';
    
    if (!tournament.matches || tournament.matches.length === 0) {
        container.innerHTML = `<div class="no-matches-court">${t('court.noMatches')}</div>`;
        return;
    }
    
    // Get all courts from both tournaments
    const allCourts = [...(tournament.menData?.courts || []), ...(tournament.womenData?.courts || [])];
    const courts = [...new Set(allCourts)].sort((a, b) => {
        const numA = parseInt(a.replace('Court ', '')) || 0;
        const numB = parseInt(b.replace('Court ', '')) || 0;
        return numA - numB;
    });
    
    
    
    if (courts.length === 0) {
        container.innerHTML = `<div class="no-matches-court">${t('court.noCourts')}</div>`;
        return;
    }
    
    // Create court cards for each court that has matches
    courts.forEach(court => {
        // Get matches for this court from both tournaments
        const menMatches = tournament.menData?.matches?.filter(match => match.court === court) || [];
        const womenMatches = tournament.womenData?.matches?.filter(match => match.court === court) || [];
        const courtMatches = [...menMatches, ...womenMatches];
        
        const courtCard = document.createElement('div');
        courtCard.className = 'court-card';
        
        // Determine tournament type based on matches
        const hasMenMatches = menMatches.length > 0;
        const hasWomenMatches = womenMatches.length > 0;
        
        if (hasMenMatches && !hasWomenMatches) {
            courtCard.classList.add('men-tournament');
        } else if (hasWomenMatches && !hasMenMatches) {
            courtCard.classList.add('women-tournament');
        } else if (hasMenMatches && hasWomenMatches) {
            // Mixed court - use men's style as default, or could be a special mixed style
            courtCard.classList.add('men-tournament');
        }
        
        // Sort matches by time
        courtMatches.sort((a, b) => {
            const timeA = a.time || '23:59';
            const timeB = b.time || '23:59';
            return timeA.localeCompare(timeB);
        });
        
        // Find current match (open status)
        const currentMatch = courtMatches.find(match => match.status === 'open');
        
        // Find next match (upcoming status)
        const nextMatch = courtMatches.find(match => match.status === 'upcoming');
        
        // Ensure court is a string and extract number
        const courtStr = String(court || 'Court 1');
        const courtNumber = courtStr.replace('Court ', '') || '1';
        
        
        courtCard.innerHTML = `
            <div class="court-header">
                <div class="court-number">${courtNumber}</div>
                <div class="court-title">${courtStr}</div>
            </div>
            <div class="court-matches">
                ${currentMatch ? createMatchSlot(currentMatch, 'current') : ''}
                ${nextMatch ? createMatchSlot(nextMatch, 'next') : ''}
                ${!currentMatch && !nextMatch ? `<div class="no-matches-court">${t('court.noMatchesScheduled')}</div>` : ''}
            </div>
        `;
        
        container.appendChild(courtCard);
    });
}

 // Create a match slot for court display
 function createMatchSlot(match, type) {
     const team1Name = match.team1?.teamName || 'TBD';
     const team2Name = match.team2?.teamName || 'TBD';
     
     // Use sex from match object (already set during parsing)
     const matchSex = match.sex || 'M';
     
     return `
         <div class="match-slot ${type}">
             <div class="match-status-badge ${type}">
                 ${type === 'current' ? t('slot.current') : t('slot.next')}
             </div>
             <div class="match-teams-compact">
                 <div class="team-row-compact">
                     <span class="team-label-compact">A</span>
                     <span class="team-name-compact">${escapeHtml(team1Name)}</span>
                 </div>
                 <div class="team-row-compact">
                     <span class="team-label-compact">B</span>
                     <span class="team-name-compact">${escapeHtml(team2Name)}</span>
                 </div>
             </div>
             <div class="match-info-compact">
                 <span class="match-time-compact">${escapeHtml(match.time || 'TBD')}</span>
                 <span class="match-number-compact">${escapeHtml(t('match.label', { n: match.matchNumber || 'TBD' }))}</span>
                 <span class="match-sex-compact">${escapeHtml(matchSex)}</span>
             </div>
         </div>
     `;
 }

// Load all games page
async function loadAllGames() {
    const loading = document.getElementById('loading');
    const matchesSection = document.getElementById('matchesSection');
    const noMatches = document.getElementById('noMatches');
    const matchesList = document.getElementById('matchesList');

    try {
        loading.style.display = 'block';
        matchesSection.style.display = 'none';
        noMatches.style.display = 'none';

        await tournament.init();
        
        // Get all matches and filter out those without court or time
        const allMatches = tournament.getAllMatches().filter(match => {
            // Filter out matches without court or time
            return match.court && match.court !== 'TBD' && match.time && match.time !== 'TBD';
        });
        
        if (allMatches.length === 0) {
            noMatches.style.display = 'block';
        } else {
            // Sort matches by time then court
            const sortedMatches = allMatches.sort((a, b) => {
                // First sort by time
                const timeA = a.time || '23:59';
                const timeB = b.time || '23:59';
                if (timeA !== timeB) {
                    return timeA.localeCompare(timeB);
                }
                // Then sort by court
                const courtA = parseInt(a.court) || 999;
                const courtB = parseInt(b.court) || 999;
                return courtA - courtB;
            });
            
            matchesSection.style.display = 'block';
            displayMatches(sortedMatches, matchesList);
        }
        
        // Build the tournament dropdown from config, then wire its change listener
        populateTournamentFilter();
        const tournamentFilter = document.getElementById('tournamentFilter');
        if (tournamentFilter) {
            tournamentFilter.addEventListener('change', (e) => {
                tournament.switchTournament(e.target.value);
            });
        }
        
        // Listen for data updates
        document.addEventListener('tournamentDataUpdated', () => {
            const updatedMatches = tournament.getAllMatches();
            if (updatedMatches.length === 0) {
                noMatches.style.display = 'block';
                matchesSection.style.display = 'none';
            } else {
                // Sort updated matches by time then court
                const sortedMatches = updatedMatches.sort((a, b) => {
                    // First sort by time
                    const timeA = a.time || '23:59';
                    const timeB = b.time || '23:59';
                    if (timeA !== timeB) {
                        return timeA.localeCompare(timeB);
                    }
                    // Then sort by court
                    const courtA = parseInt(a.court) || 999;
                    const courtB = parseInt(b.court) || 999;
                    return courtA - courtB;
                });
                
                matchesSection.style.display = 'block';
                noMatches.style.display = 'none';
                displayMatches(sortedMatches, matchesList);
            }
        });
        
    } catch (error) {
        console.error('Error loading all games:', error);
        noMatches.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Load next games page
async function loadNextGames() {
    const loading = document.getElementById('loading');
    const matchesSection = document.getElementById('matchesSection');
    const noMatches = document.getElementById('noMatches');
    const matchesList = document.getElementById('matchesList');

    try {
        loading.style.display = 'block';
        matchesSection.style.display = 'none';
        noMatches.style.display = 'none';

        await tournament.init();
        
        // Show upcoming matches
        const nextMatches = tournament.getNextGames();
        
        if (nextMatches.length === 0) {
            noMatches.style.display = 'block';
        } else {
            matchesSection.style.display = 'block';
            displayMatches(nextMatches, matchesList);
        }
        
    } catch (error) {
        console.error('Error loading next games:', error);
        noMatches.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Load last results page
async function loadLastResults() {
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');
    const noResults = document.getElementById('noResults');
    const resultsList = document.getElementById('resultsList');

    try {
        loading.style.display = 'block';
        resultsSection.style.display = 'none';
        noResults.style.display = 'none';

        await tournament.init();
        
        // Show completed matches
        const completedMatches = tournament.getCompletedMatches();
        
        if (completedMatches.length === 0) {
            noResults.style.display = 'block';
        } else {
            resultsSection.style.display = 'block';
            displayMatches(completedMatches, resultsList);
        }
        
    } catch (error) {
        console.error('Error loading last results:', error);
        noResults.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Display matches in a list
function displayMatches(matches, container) {
    container.innerHTML = '';
    
    if (!matches || matches.length === 0) {
        container.innerHTML = `<p>${t('list.empty')}</p>`;
        return;
    }

    matches.forEach(match => {
        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';

         const team1Name = match.team1?.teamName || 'TBD';
         const team2Name = match.team2?.teamName || 'TBD';

        // Use status from Excel status column
        let statusClass = 'upcoming';
        let statusText = t('status.upcoming');

        if (match.status === 'concluded') {
            statusClass = 'completed';
            statusText = t('status.completed');
        } else if (match.status === 'open') {
            statusClass = 'in-progress';
            statusText = t('status.inProgress');
        } else if (match.status === 'upcoming') {
            statusClass = 'upcoming';
            statusText = t('status.upcoming');
        }
        
        matchCard.innerHTML = `
            <div class="match-content">
                 <div class="match-teams">
                     <div class="team-row">
                         <span class="team-label">A</span>
                         <span class="team-name">${escapeHtml(team1Name)}</span>
                     </div>
                     <div class="team-row">
                         <span class="team-label">B</span>
                         <span class="team-name">${escapeHtml(team2Name)}</span>
                     </div>
                 </div>
                <div class="match-info">
                    <div class="match-highlight">
                        <div class="highlight-item court-highlight">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${escapeHtml(match.court || 'TBD')}</span>
                        </div>
                        <div class="highlight-item time-highlight">
                            <i class="fas fa-clock"></i>
                            <span>${escapeHtml(match.time || 'TBD')}</span>
                        </div>
                    </div>
                    <div class="match-details">
                        <div class="match-number">
                            <i class="fas fa-hashtag"></i>
                            <span>${escapeHtml(t('match.label', { n: match.matchNumber || 'TBD' }))}</span>
                        </div>
                        <div class="match-round">
                            <i class="fas fa-trophy"></i>
                            <span>${escapeHtml(t('match.round', { n: match.round || 'TBD' }))}</span>
                        </div>
                        <div class="match-sex">
                            <i class="fas fa-mars"></i>
                            <span>${escapeHtml(match.sex || 'M')}</span>
                        </div>
                        <div class="match-status ${statusClass}">
                            <i class="fas fa-circle"></i>
                            <span>${statusText}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(matchCard);
    });
}

// Load tableau page
async function loadTableau() {
    const loading = document.getElementById('loading');
    const tableauSection = document.getElementById('tableauSection');
    const noData = document.getElementById('noData');
    const bracketContainer = document.getElementById('bracketContainer');

    try {
        loading.style.display = 'block';
        tableauSection.style.display = 'none';
        noData.style.display = 'none';

        await tournament.init();
        
        // Generate tournament bracket
        if (bracketContainer) {
            generateTournamentBracket(bracketContainer);
        }
        
        // Load standings
        await loadStandings();
        
        // Show tableau
        tableauSection.style.display = 'block';
        
        // Build the tournament dropdown from config, then wire its change listener
        populateTournamentFilter();
        const tournamentFilter = document.getElementById('tournamentFilter');
        if (tournamentFilter) {
            tournamentFilter.addEventListener('change', (e) => {
                tournament.switchTournament(e.target.value);
            });
        }
        
        // Listen for data updates
        document.addEventListener('tournamentDataUpdated', () => {
            if (bracketContainer) {
                generateTournamentBracket(bracketContainer);
            }
            loadStandings();
        });
        
    } catch (error) {
        console.error('Error loading tableau:', error);
        noData.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

// Generate compact tournament bracket diagram
function generateTournamentBracket(container) {
    container.innerHTML = '';
    
    // Get matches from the currently selected tournament only
    const allMatches = tournament.matches || [];
    
    if (allMatches.length === 0) {
        container.innerHTML = `<div class="no-bracket">${t('bracket.empty')}</div>`;
        return;
    }
    
    // Create the main bracket container
    const bracket = document.createElement('div');
    bracket.className = 'bracket';
    
    // Sort matches by match number
    const sortedMatches = allMatches.sort((a, b) => a.matchNumber - b.matchNumber);
    
    // Create match map for easy access
    const matchMap = {};
    sortedMatches.forEach(match => {
        matchMap[match.matchNumber] = match;
    });
    
    // Create complete bracket structure with all expected matches
    // Round I (matches 1-8)
    const round1Matches = createMatchesForRange(1, 8, sortedMatches);
    const round1 = createRound(t('bracket.roundI'), round1Matches);
    bracket.appendChild(round1);

    // Winner R1 / Round II (matches 13-16)
    const winnerR1Matches = createMatchesForRange(13, 16, sortedMatches);
    const winnerR1 = createRound(t('bracket.winnerR1'), winnerR1Matches);
    bracket.appendChild(winnerR1);

    // Winner R2 (matches 21-22)
    const winnerR2Matches = createMatchesForRange(21, 22, sortedMatches);
    const winnerR2 = createRound(t('bracket.winnerR2'), winnerR2Matches);
    bracket.appendChild(winnerR2);
    
    // Semifinals with nested Finals
    const semifinalsContainer = document.createElement('div');
    semifinalsContainer.className = 'semifinals-container';
    
    // Semifinal 1 (match 27)
    const sf1Matches = createMatchesForRange(27, 27, sortedMatches);
    const sf1 = createRound(t('bracket.semifinals'), sf1Matches);
    semifinalsContainer.appendChild(sf1);

    // Finals (matches 29-30) - nested inside semifinals
    const finalMatches = createMatchesForRange(29, 30, sortedMatches);
    const finals = createRound(t('bracket.finals'), finalMatches, true);
    semifinalsContainer.appendChild(finals);

    // Semifinal 2 (match 28)
    const sf2Matches = createMatchesForRange(28, 28, sortedMatches);
    const sf2 = createRound(t('bracket.semifinals'), sf2Matches);
    semifinalsContainer.appendChild(sf2);
    
    bracket.appendChild(semifinalsContainer);
    
    // Losers bracket (flows right to left)
    const losersContainer = document.createElement('div');
    losersContainer.className = 'losers-bracket-container';
    
    // Loser R4 (matches 25-26) - rightmost
    const lr4Matches = createMatchesForRange(25, 26, sortedMatches);
    const lr4 = createRound(t('bracket.loserR4'), lr4Matches);
    losersContainer.appendChild(lr4);

    // Loser R3 (matches 23-24) - second rightmost
    const lr3Matches = createMatchesForRange(23, 24, sortedMatches);
    const lr3 = createRound(t('bracket.loserR3'), lr3Matches);
    losersContainer.appendChild(lr3);

    // Loser R2 (matches 17-20) - third rightmost
    const lr2Matches = createMatchesForRange(17, 20, sortedMatches);
    const lr2 = createRound(t('bracket.loserR2'), lr2Matches);
    losersContainer.appendChild(lr2);

    // Loser R1 (matches 9-12) - fourth rightmost
    const lr1Matches = createMatchesForRange(9, 12, sortedMatches);
    const lr1 = createRound(t('bracket.loserR1'), lr1Matches);
    losersContainer.appendChild(lr1);
    
    bracket.appendChild(losersContainer);
    
    // Add zoom controls
    addZoomControls(bracket);
    
    container.appendChild(bracket);
}

// Create matches for a range, filling in missing matches with placeholders
function createMatchesForRange(start, end, existingMatches) {
    const matches = [];
    const matchMap = {};
    
    // Create a map of existing matches for quick lookup
    existingMatches.forEach(match => {
        matchMap[match.matchNumber] = match;
    });
    
    // Create matches for the range
    for (let i = start; i <= end; i++) {
        if (matchMap[i]) {
            // Use existing match if available
            matches.push(matchMap[i]);
        } else {
            // Create placeholder match
            matches.push({
                id: `match_placeholder_${i}`,
                matchNumber: i,
                team1: { teamName: 'Team 1' },
                team2: { teamName: 'Team 2' },
                status: 'upcoming',
                result: null,
                score: null,
                court: 'TBD',
                time: 'TBD',
                round: 'TBD',
                sex: 'M' // Default to men's tournament
            });
        }
    }
    
    return matches;
}

// Add zoom controls to bracket
function addZoomControls(bracket) {
    // Remove any existing zoom controls so they don't stack up on each refresh
    document.querySelectorAll('.bracket-zoom-controls').forEach(el => el.remove());

    const zoomControls = document.createElement('div');
    zoomControls.className = 'bracket-zoom-controls';
    zoomControls.innerHTML = `
        <button class="zoom-btn" id="zoomOut">-</button>
        <span class="zoom-level" id="zoomLevel">100%</span>
        <button class="zoom-btn" id="zoomIn">+</button>
        <button class="zoom-btn" id="zoomReset">Reset</button>
    `;
    
    document.body.appendChild(zoomControls);
    
    let currentZoom = 1;
    const zoomLevel = document.getElementById('zoomLevel');
    
    // Zoom in
    document.getElementById('zoomIn').addEventListener('click', () => {
        currentZoom = Math.min(currentZoom + 0.2, 2.5);
        bracket.style.transform = `scale(${currentZoom})`;
        zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
    });
    
    // Zoom out
    document.getElementById('zoomOut').addEventListener('click', () => {
        currentZoom = Math.max(currentZoom - 0.2, 1.0);
        bracket.style.transform = `scale(${currentZoom})`;
        zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
    });
    
    // Reset zoom
    document.getElementById('zoomReset').addEventListener('click', () => {
        currentZoom = 1;
        bracket.style.transform = 'scale(1)';
        zoomLevel.textContent = '100%';
    });
}

// Create a round with matches
function createRound(title, matches, isFinals = false) {
    const round = document.createElement('div');
    round.className = 'round';
    
    const roundTitle = document.createElement('div');
    roundTitle.className = 'round-title';
    roundTitle.textContent = title;
    round.appendChild(roundTitle);
    
    matches.forEach(match => {
        const matchEl = createMatch(match, isFinals);
        round.appendChild(matchEl);
    });
    
    return round;
}

// Create individual match element
function createMatch(match, isFinals = false) {
    const matchDiv = document.createElement('div');
    matchDiv.className = `match ${isFinals ? 'finals-match' : ''}`;
    matchDiv.setAttribute('data-match', match.matchNumber);
    
    const matchNumber = document.createElement('span');
    matchNumber.className = 'match-number';
    
    // Label final matches
    if (match.matchNumber === 29) {
        matchNumber.textContent = t('bracket.matchThird', { n: match.matchNumber });
    } else if (match.matchNumber === 30) {
        matchNumber.textContent = t('bracket.matchFinal', { n: match.matchNumber });
    } else {
        matchNumber.textContent = t('bracket.match', { n: match.matchNumber });
    }
    
    matchDiv.appendChild(matchNumber);
    
    // Parse score if available
    let team1Score = '-';
    let team2Score = '-';
    // Prefer the authoritative sets-won values from the result columns (G/H)
    if (match.team1Sets !== null && match.team1Sets !== undefined &&
        match.team2Sets !== null && match.team2Sets !== undefined) {
        team1Score = match.team1Sets.toString();
        team2Score = match.team2Sets.toString();
    } else if (match.score) {
        const scoreStr = match.score.toString().trim();

        // Try simple format like "0 2" (sets won by each team)
        const simpleMatch = scoreStr.match(/^(\d+)\s+(\d+)$/);
        if (simpleMatch) {
            team1Score = simpleMatch[1];
            team2Score = simpleMatch[2];
        } else {
            // Try to extract final score from complex format like "15 <> 21 16 <> 21"
            const allScores = scoreStr.match(/(\d+)\s*<>\s*(\d+)/g);
            if (allScores && allScores.length > 0) {
                // Count sets won by each team
                let team1Sets = 0;
                let team2Sets = 0;
                allScores.forEach(setScore => {
                    const setMatch = setScore.match(/(\d+)\s*<>\s*(\d+)/);
                    if (setMatch) {
                        const score1 = parseInt(setMatch[1]);
                        const score2 = parseInt(setMatch[2]);
                        if (score1 > score2) team1Sets++;
                        else if (score2 > score1) team2Sets++;
                    }
                });
                team1Score = team1Sets.toString();
                team2Score = team2Sets.toString();
            } else {
                // Try other formats
                const scoreMatch = scoreStr.match(/(\d+)[\s:,-]+(\d+)/);
                if (scoreMatch) {
                    team1Score = scoreMatch[1];
                    team2Score = scoreMatch[2];
                }
            }
        }
    }
    
    // Team 1
    const team1Div = document.createElement('div');
    team1Div.className = 'team';
    team1Div.innerHTML = `
        <span class="team-name">${escapeHtml(match.team1?.teamName || 'TBD')}</span>
        <span class="score">${escapeHtml(team1Score)}</span>
    `;
    matchDiv.appendChild(team1Div);
    
    // Team 2
    const team2Div = document.createElement('div');
    team2Div.className = 'team';
    team2Div.innerHTML = `
        <span class="team-name">${escapeHtml(match.team2?.teamName || 'TBD')}</span>
        <span class="score">${escapeHtml(team2Score)}</span>
    `;
    matchDiv.appendChild(team2Div);
    
    return matchDiv;
}

// Generate winners bracket (left side) - early rounds only
function generateWinnersBracket(container, sortedRounds, matchesByRound) {
    // Only show early rounds in winners bracket
    const earlyRounds = sortedRounds.filter(round => 
        round === 'Round I' || round === 'Round II' || round === 'Round III'
    );
    
    earlyRounds.forEach(round => {
        const roundContainer = document.createElement('div');
        roundContainer.className = 'bracket-round';
        
        const roundTitle = document.createElement('div');
        roundTitle.className = 'round-title';
        roundTitle.textContent = round;
        roundContainer.appendChild(roundTitle);
        
        const matchesContainer = document.createElement('div');
        matchesContainer.className = 'round-matches';
        
        const roundMatches = matchesByRound[round] || [];
        const sortedMatches = roundMatches.sort((a, b) => a.matchNumber - b.matchNumber);
        
        sortedMatches.forEach((match, index) => {
            const matchElement = createBracketMatch(match);
            matchesContainer.appendChild(matchElement);
            
            // Add connection line
            if (index < sortedMatches.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'match-connector';
                matchesContainer.appendChild(connector);
            }
        });
        
        roundContainer.appendChild(matchesContainer);
        container.appendChild(roundContainer);
    });
}

// Generate finals bracket (center) - only finals matches
function generateFinalsBracket(container, matchesByRound) {
    const finalsRounds = ['SF', 'F', 'Final'];
    
    finalsRounds.forEach(round => {
        if (matchesByRound[round] && matchesByRound[round].length > 0) {
            const roundContainer = document.createElement('div');
            roundContainer.className = 'bracket-round';
            
            const roundTitle = document.createElement('div');
            roundTitle.className = 'round-title';
            roundTitle.textContent = round;
            roundContainer.appendChild(roundTitle);
            
            const matchesContainer = document.createElement('div');
            matchesContainer.className = 'round-matches';
            
            const roundMatches = matchesByRound[round];
            const sortedMatches = roundMatches.sort((a, b) => a.matchNumber - b.matchNumber);
            
            sortedMatches.forEach((match, index) => {
                const matchElement = createBracketMatch(match, true);
                matchesContainer.appendChild(matchElement);
                
                // Add connection line
                if (index < sortedMatches.length - 1) {
                    const connector = document.createElement('div');
                    connector.className = 'match-connector';
                    matchesContainer.appendChild(connector);
                }
            });
            
            roundContainer.appendChild(matchesContainer);
            container.appendChild(roundContainer);
        }
    });
}

// Generate losers bracket (right side) - consolation matches
function generateLosersBracket(container, sortedRounds, matchesByRound) {
    // Show all rounds in losers bracket (consolation)
    sortedRounds.forEach(round => {
        const roundContainer = document.createElement('div');
        roundContainer.className = 'bracket-round';
        
        const roundTitle = document.createElement('div');
        roundTitle.className = 'round-title';
        roundTitle.textContent = round;
        roundContainer.appendChild(roundTitle);
        
        const matchesContainer = document.createElement('div');
        matchesContainer.className = 'round-matches';
        
        const roundMatches = matchesByRound[round] || [];
        const sortedMatches = roundMatches.sort((a, b) => a.matchNumber - b.matchNumber);
        
        sortedMatches.forEach((match, index) => {
            const matchElement = createBracketMatch(match);
            matchesContainer.appendChild(matchElement);
            
            // Add connection line
            if (index < sortedMatches.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'match-connector';
                matchesContainer.appendChild(connector);
            }
        });
        
        roundContainer.appendChild(matchesContainer);
        container.appendChild(roundContainer);
    });
}

// Create individual match element for bracket
function createBracketMatch(match, isFinals = false) {
    const matchDiv = document.createElement('div');
    matchDiv.className = `bracket-match ${isFinals ? 'finals-match' : ''}`;
    
    const team1Name = match.team1?.teamName || 'TBD';
    const team2Name = match.team2?.teamName || 'TBD';
    
    // Determine match status
    let statusClass = 'upcoming';
    let statusText = t('status.upcoming');

    if (match.result) {
        statusClass = 'completed';
        statusText = t('status.completed');
    } else {
        const now = new Date();
        const matchTime = match.time && match.time !== 'TBD' ? new Date(`2025-09-20T${match.time}`) : null;
        if (matchTime && matchTime < now) {
            statusClass = 'in-progress';
            statusText = t('status.inProgress');
        }
    }
    
    matchDiv.innerHTML = `
        <div class="match-header">
            <span class="match-number">${match.matchNumber}</span>
            <span class="match-court">${match.court || 'TBD'}</span>
        </div>
        <div class="match-teams">
            <div class="team-row">
                <span class="team-label">A</span>
                <span class="team-name">${team1Name}</span>
            </div>
            <div class="team-row">
                <span class="team-label">B</span>
                <span class="team-name">${team2Name}</span>
            </div>
        </div>
        <div class="match-info">
            <span class="match-time">${match.time || 'TBD'}</span>
            <span class="match-status ${statusClass}">${statusText}</span>
        </div>
    `;
    
    return matchDiv;
}

// Setup tab navigation for tableau page
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetTab = button.getAttribute('data-tab');
            document.getElementById(targetTab + 'Tab').classList.add('active');
        });
    });
}

// Load standings from Rangliste sheet
async function loadStandings() {
    try {
        const standingsContainer = document.getElementById('standingsTable');
        if (!standingsContainer) return;

        // Read the source (local file or Google Sheet) matching the selected tournament
        const response = await fetch(buildDataUrl(tournament.currentTournament, true), { cache: 'no-store' });
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Find Rangliste sheet
        const ranglisteSheet = workbook.Sheets['Rangliste'];
        if (!ranglisteSheet) {
            console.warn('Rangliste sheet not found');
            standingsContainer.innerHTML = `<p>${t('standings.unavailable')}</p>`;
            return;
        }

        // Parse standings data
        const standingsData = XLSX.utils.sheet_to_json(ranglisteSheet, { header: 1 });
        
        // Generate standings table
        generateStandingsTable(standingsData, standingsContainer);
        
    } catch (error) {
        console.error('Error loading standings:', error);
        const standingsContainer = document.getElementById('standingsTable');
        if (standingsContainer) {
            standingsContainer.innerHTML = `<p>${t('standings.loadError')}</p>`;
        }
    }
}

// Generate standings table
function generateStandingsTable(data, container) {
    if (!data || data.length < 2) {
        container.innerHTML = `<p>${t('standings.empty')}</p>`;
        return;
    }

    // Create table
    const table = document.createElement('table');
    table.className = 'standings-table';
    
    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Use first row as headers
    const headers = data[0];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header || '';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create body
    const tbody = document.createElement('tbody');
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row && row.some(cell => cell !== '')) { // Skip empty rows
            // Skip row 19 (index 18) which contains the "Zur einfacheren Bedienung..." text
            if (i === 18) {
                continue;
            }
            
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell || '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        }
    }
    table.appendChild(tbody);
    
    container.innerHTML = '';
    container.appendChild(table);
}

// Add refresh button functionality
function setupRefreshButtons() {
    const refreshButtons = document.querySelectorAll('#refreshButton');
    
    refreshButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Add loading state to button
            const originalContent = button.innerHTML;
            button.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> ${t('refresh.loading')}`;
            button.disabled = true;

            try {
                // Call manual refresh
                await tournament.manualRefresh();

                // Show success feedback
                button.innerHTML = `<i class="fas fa-check"></i> ${t('refresh.done')}`;
                button.style.background = 'var(--success)';

                // Reset button after 2 seconds
                setTimeout(() => {
                    button.innerHTML = originalContent;
                    button.disabled = false;
                    button.style.background = '';
                }, 2000);

            } catch (error) {
                console.error('Refresh failed:', error);

                // Show error feedback
                button.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${t('refresh.error')}`;
                button.style.background = 'var(--danger)';
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    button.innerHTML = originalContent;
                    button.disabled = false;
                    button.style.background = '';
                }, 3000);
            }
        });
    });
}

// Initialize refresh buttons when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupRefreshButtons();
});

// When the language changes, re-localize the dynamic content: refresh the
// tournament dropdown labels, the "last updated" line, and re-render the
// JS-built views by reusing the existing data-update event.
document.addEventListener('appLanguageChanged', function() {
    if (typeof populateTournamentFilter === 'function') populateTournamentFilter();
    if (tournament && typeof tournament.updateLastUpdatedTime === 'function') {
        tournament.updateLastUpdatedTime();
    }
    document.dispatchEvent(new CustomEvent('tournamentDataUpdated'));
});