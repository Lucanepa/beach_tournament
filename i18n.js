// Lightweight i18n for the ZuZu Beach tournament site.
// Two languages (DE / EN); the whole UI shows exactly one at a time.
//
// Usage:
//   - Static HTML: add data-i18n="key" (textContent), data-i18n-title="key",
//     or data-i18n-placeholder="key". applyI18n() fills them in.
//   - Dynamic JS strings: call t('key', { n: 3 }) — "{n}" placeholders are
//     interpolated.
//   - A DE|EN toggle in the header calls setLang(); it persists the choice,
//     re-translates static markup, and dispatches 'appLanguageChanged' so the
//     dynamically-rendered content (courts, matches, bracket, standings)
//     re-renders in the new language.

const I18N = {
    de: {
        'brand.tagline': 'Turnier',
        'page.indexTitle': 'ZuZu Beach Turnier',
        'page.tableauTitle': 'Tableau – ZuZu Beach Turnier',
        'page.allGamesTitle': 'Alle Spiele – ZuZu Beach Turnier',

        'nav.allGames': 'Alle Spiele',
        'nav.tableau': 'Tableau',
        'nav.refresh': 'Aktualisieren',
        'nav.back': 'Zurück zur Startseite',
        'nav.settings': 'Einstellungen',

        'settings.heading': 'Einstellungen',
        'settings.courtCount': 'Anzahl Courts',
        'settings.courtCountHint': '0 = automatisch aus den Daten',
        'settings.refresh': 'Auto-Aktualisierung (Sekunden)',
        'settings.tournaments': 'Angezeigte Turniere',
        'settings.men': 'Herren',
        'settings.women': 'Damen',
        'settings.defaultLang': 'Standardsprache',
        'settings.save': 'Speichern',
        'settings.saved': 'Gespeichert!',
        'settings.reset': 'Zurücksetzen',
        'page.settingsTitle': 'Einstellungen – ZuZu Beach Turnier',

        'court.free': 'Frei',

        'heading.tableau': 'Tableau & Rangliste',
        'heading.allGames': 'Alle Spiele',

        'loading.matches': 'Lade Spieldaten…',
        'loading.tableau': 'Lade Tableau-Daten…',
        'loading.allGames': 'Lade alle Spiele…',

        'empty.noMatchesTitle': 'Keine Spiele verfügbar',
        'empty.noMatchesIndex': 'Derzeit sind keine Spiele geplant.',
        'empty.noMatchesAllGames': 'Es sind derzeit keine Spiele geplant.',
        'empty.noDataTitle': 'Keine Daten verfügbar',
        'empty.noDataBody': 'Es konnten keine Tableau-Daten geladen werden.',

        'filter.tournament': 'Turnier:',
        'tabs.bracket': 'Turnierbaum',
        'tabs.standings': 'Rangliste',
        'footer.copyright': '© 2025 ZuZu Beach Turnier Kloten',

        'tournament.men': 'U20 Herren (U20M)',
        'tournament.women': 'U20 Damen (U20F)',

        'court.noMatches': 'Keine Spiele verfügbar',
        'court.noCourts': 'Keine Courts verfügbar',
        'court.noMatchesScheduled': 'Keine Spiele geplant',
        'slot.current': 'Aktuell',
        'slot.next': 'Nächste',

        'match.label': 'Spiel {n}',
        'match.round': 'Runde {n}',
        'list.empty': 'Keine Spiele verfügbar.',

        'status.upcoming': 'Bevorstehend',
        'status.completed': 'Beendet',
        'status.inProgress': 'Laufend',

        'bracket.empty': 'Keine Turnierdaten verfügbar',
        'bracket.roundI': 'Runde I',
        'bracket.winnerR1': 'Sieger R1',
        'bracket.winnerR2': 'Sieger R2',
        'bracket.semifinals': 'Halbfinale',
        'bracket.finals': 'Finale',
        'bracket.loserR1': 'Verlierer R1',
        'bracket.loserR2': 'Verlierer R2',
        'bracket.loserR3': 'Verlierer R3',
        'bracket.loserR4': 'Verlierer R4',
        'bracket.match': 'Spiel {n}',
        'bracket.matchThird': 'Spiel {n} (3./4.)',
        'bracket.matchFinal': 'Spiel {n} (1./2.)',

        'standings.unavailable': 'Rangliste-Daten nicht verfügbar',
        'standings.loadError': 'Fehler beim Laden der Rangliste',
        'standings.empty': 'Keine Rangliste-Daten verfügbar',

        'refresh.loading': 'Aktualisiere…',
        'refresh.done': 'Aktualisiert!',
        'refresh.error': 'Fehler',
        'updated.prefix': 'Letzte Aktualisierung:',
        'updated.toast': 'Daten aktualisiert',

        'error.loadData': 'Fehler beim Laden der Turnierdaten',
        'error.refreshData': 'Fehler beim Aktualisieren der Daten',
    },
    en: {
        'brand.tagline': 'Tournament',
        'page.indexTitle': 'ZuZu Beach Tournament',
        'page.tableauTitle': 'Tableau – ZuZu Beach Tournament',
        'page.allGamesTitle': 'All games – ZuZu Beach Tournament',

        'nav.allGames': 'All games',
        'nav.tableau': 'Tableau',
        'nav.refresh': 'Refresh',
        'nav.back': 'Back to home',
        'nav.settings': 'Settings',

        'settings.heading': 'Settings',
        'settings.courtCount': 'Number of courts',
        'settings.courtCountHint': '0 = automatic from data',
        'settings.refresh': 'Auto-refresh (seconds)',
        'settings.tournaments': 'Tournaments shown',
        'settings.men': 'Men',
        'settings.women': 'Women',
        'settings.defaultLang': 'Default language',
        'settings.save': 'Save',
        'settings.saved': 'Saved!',
        'settings.reset': 'Reset',
        'page.settingsTitle': 'Settings – ZuZu Beach Tournament',

        'court.free': 'Free',

        'heading.tableau': 'Tableau & standings',
        'heading.allGames': 'All games',

        'loading.matches': 'Loading match data…',
        'loading.tableau': 'Loading tableau data…',
        'loading.allGames': 'Loading all games…',

        'empty.noMatchesTitle': 'No matches available',
        'empty.noMatchesIndex': 'No matches are currently scheduled.',
        'empty.noMatchesAllGames': 'There are currently no scheduled matches.',
        'empty.noDataTitle': 'No data available',
        'empty.noDataBody': 'No tableau data could be loaded.',

        'filter.tournament': 'Tournament:',
        'tabs.bracket': 'Bracket',
        'tabs.standings': 'Standings',
        'footer.copyright': '© 2025 ZuZu Beach Tournament Kloten',

        'tournament.men': 'U20 Men (U20M)',
        'tournament.women': 'U20 Women (U20F)',

        'court.noMatches': 'No matches available',
        'court.noCourts': 'No courts available',
        'court.noMatchesScheduled': 'No matches scheduled',
        'slot.current': 'Current',
        'slot.next': 'Next',

        'match.label': 'Match {n}',
        'match.round': 'Round {n}',
        'list.empty': 'No matches available.',

        'status.upcoming': 'Upcoming',
        'status.completed': 'Completed',
        'status.inProgress': 'In progress',

        'bracket.empty': 'No tournament data available',
        'bracket.roundI': 'Round I',
        'bracket.winnerR1': 'Winner R1',
        'bracket.winnerR2': 'Winner R2',
        'bracket.semifinals': 'Semifinals',
        'bracket.finals': 'Finals',
        'bracket.loserR1': 'Loser R1',
        'bracket.loserR2': 'Loser R2',
        'bracket.loserR3': 'Loser R3',
        'bracket.loserR4': 'Loser R4',
        'bracket.match': 'Match {n}',
        'bracket.matchThird': 'Match {n} (3rd/4th)',
        'bracket.matchFinal': 'Match {n} (1st/2nd)',

        'standings.unavailable': 'Standings data unavailable',
        'standings.loadError': 'Error loading standings',
        'standings.empty': 'No standings data available',

        'refresh.loading': 'Refreshing…',
        'refresh.done': 'Refreshed!',
        'refresh.error': 'Error',
        'updated.prefix': 'Last updated:',
        'updated.toast': 'Data updated',

        'error.loadData': 'Error loading tournament data',
        'error.refreshData': 'Error refreshing data',
    },
};

const SUPPORTED_LANGS = ['de', 'en'];
const DEFAULT_LANG = 'de';

function getLang() {
    const stored = (() => { try { return localStorage.getItem('zuzu-lang'); } catch (e) { return null; } })();
    if (SUPPORTED_LANGS.includes(stored)) return stored;
    // No per-visitor choice yet → fall back to the organizer's default (settings.js).
    if (typeof getSettings === 'function') {
        const d = getSettings().defaultLang;
        if (SUPPORTED_LANGS.includes(d)) return d;
    }
    return DEFAULT_LANG;
}

// Translate a key for the current language, interpolating {placeholder} params.
function t(key, params) {
    const lang = getLang();
    const table = I18N[lang] || I18N[DEFAULT_LANG];
    let str = (table && table[key] !== undefined) ? table[key] : (I18N[DEFAULT_LANG][key] !== undefined ? I18N[DEFAULT_LANG][key] : key);
    if (params) {
        Object.keys(params).forEach(p => {
            str = str.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
        });
    }
    return str;
}

// Fill in all static [data-i18n*] markup within `root`.
function applyI18n(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    // <title> lives outside <body>; translate it via a data-i18n on the element.
    const titleEl = document.querySelector('title[data-i18n]');
    if (titleEl) document.title = t(titleEl.getAttribute('data-i18n'));

    updateLangToggle();
}

// Reflect the active language on the DE|EN toggle buttons.
function updateLangToggle() {
    const lang = getLang();
    document.querySelectorAll('.lang-toggle [data-lang]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
}

// Switch language: persist, re-translate static markup, and signal a re-render.
function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    try { localStorage.setItem('zuzu-lang', lang); } catch (e) { /* ignore */ }
    document.documentElement.lang = lang;
    applyI18n(document);
    document.dispatchEvent(new CustomEvent('appLanguageChanged', { detail: { lang } }));
}

// Wire the header toggle + apply translations as soon as the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = getLang();
    document.querySelectorAll('.lang-toggle [data-lang]').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
    });
    applyI18n(document);
});
