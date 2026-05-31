// Organizer settings for the ZuZu Beach board, persisted in localStorage.
// Loaded before i18n.js and script.js on every page so both can read them.
//
//   courtCount     0 = auto (derive courts from the sheet data); N = show Court 1..N
//   refreshSeconds  how often the sheets are re-checked (min 3s)
//   tournaments     which tournaments the home board shows: ['men','women']
//   defaultLang     starting language when a visitor hasn't picked one ('de'|'en')

const SETTINGS_KEY = 'zuzu-settings';
const DEFAULT_SETTINGS = {
    courtCount: 0,
    refreshSeconds: 10,
    tournaments: ['men', 'women'],
    defaultLang: 'de',
};

function getSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        const merged = Object.assign({}, DEFAULT_SETTINGS, stored);
        // Sanitize
        merged.courtCount = Math.max(0, parseInt(merged.courtCount, 10) || 0);
        merged.refreshSeconds = Math.max(3, parseInt(merged.refreshSeconds, 10) || 10);
        if (!Array.isArray(merged.tournaments) || merged.tournaments.length === 0) {
            merged.tournaments = DEFAULT_SETTINGS.tournaments.slice();
        }
        if (!['de', 'en'].includes(merged.defaultLang)) merged.defaultLang = 'de';
        return merged;
    } catch (e) {
        return Object.assign({}, DEFAULT_SETTINGS);
    }
}

function saveSettings(patch) {
    const next = Object.assign(getSettings(), patch);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
    return next;
}
