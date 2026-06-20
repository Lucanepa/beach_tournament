import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getSettings } from './settings'

const de = {
  'brand.tagline': 'Turnier',
  'nav.allGames': 'Alle Spiele',
  'nav.tableau': 'Tableau',
  'nav.refresh': 'Aktualisieren',
  'nav.back': 'Zurück zur Startseite',
  'nav.admin': 'Admin',
  'nav.home': 'Start',

  'settings.heading': 'Einstellungen',
  'settings.courtCount': 'Anzahl Courts',
  'settings.courtCountHint': '0 = automatisch aus den Daten',
  'settings.refresh': 'Auto-Aktualisierung (Sekunden)',
  'settings.tournaments': 'Angezeigte Turniere',
  'settings.men': 'Herren',
  'settings.women': 'Damen',
  'settings.defaultLang': 'Standardsprache',
  'settings.notes': 'Hinweise',
  'settings.notesDe': 'Hinweise (DE)',
  'settings.notesEn': 'Hinweise (EN)',
  'settings.notesHint': 'Werden auf der Startseite angezeigt.',
  'settings.notesPlaceholder': 'z. B. Sätze 1–2: bis 21, Satz 3: bis 15. Court 5 & 6 ab 15:00 frei.',
  'settings.save': 'Speichern',
  'settings.saved': 'Gespeichert!',
  'settings.reset': 'Zurücksetzen',

  'admin.heading': 'Admin',
  'admin.pinLabel': 'PIN eingeben',
  'admin.unlock': 'Entsperren',
  'admin.wrongPin': 'Falscher PIN',
  'admin.lock': 'Sperren',
  'admin.notConfigured': 'ADMIN_PIN ist nicht gesetzt (Cloudflare Pages → Settings → Environment variables).',
  'admin.scoresHeading': 'Spielstände',
  'admin.scoresHint': 'Court & Setzergebnisse eingeben – Resultat, Tableau & Rangliste aktualisieren sich automatisch.',
  'admin.courtLabel': 'Court',
  'admin.loadingScores': 'Lade Spiele…',
  'admin.noScores': 'Keine Spiele zum Bearbeiten.',
  'admin.saveError': 'Fehler beim Speichern',
  'admin.partialSet': 'Bitte beide Satzergebnisse eingeben.',
  'admin.invalidSet': 'Ungültiger Satz (bis {target}, 2 Punkte Vorsprung).',
  'admin.set3Locked': '3. Satz nur bei 1:1.',
  'admin.sessionExpired': 'Sitzung abgelaufen – bitte erneut anmelden.',

  'court.free': 'Frei',
  'court.noCourts': 'Keine Courts verfügbar',
  'court.noMatchesScheduled': 'Keine Spiele geplant',

  'heading.tableau': 'Tableau & Rangliste',
  'heading.allGames': 'Alle Spiele',
  'heading.courts': 'Courts',

  'loading.matches': 'Lade Spieldaten…',
  'loading.tableau': 'Lade Tableau-Daten…',
  'loading.allGames': 'Lade alle Spiele…',

  'empty.noMatchesTitle': 'Keine Spiele verfügbar',
  'empty.noMatchesIndex': 'Derzeit sind keine Spiele geplant.',
  'empty.noMatchesAllGames': 'Es sind derzeit keine Spiele geplant.',
  'empty.noDataTitle': 'Keine Daten verfügbar',
  'empty.noDataBody': 'Es konnten keine Tableau-Daten geladen werden.',

  'filter.tournament': 'Turnier',
  'filter.team': 'Team',
  'filter.teamAll': 'Alle Teams',
  'filter.teamClear': 'Filter zurücksetzen',
  'empty.teamNotScheduled': 'Für {team} läuft gerade kein Spiel und es ist keines als Nächstes angesetzt.',
  'empty.teamNoGames': 'Keine Spiele für {team}.',
  'empty.teamNoPath': 'Für {team} sind noch keine Spiele im Tableau.',
  'tabs.bracket': 'Turnierbaum',
  'tabs.standings': 'Rangliste',
  'footer.copyright': '© 2026 ZuZu Beach Turnier Kloten',

  'court.label': 'Court {n}',
  'slot.current': 'Aktuell',
  'slot.next': 'Nächste',
  'slot.live': 'Live',

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
  'bracket.thirdPlace': '3./4. Platz',
  'bracket.loserR1': 'Verlierer R1',
  'bracket.loserR2': 'Verlierer R2',
  'bracket.loserR3': 'Verlierer R3',
  'bracket.loserR4': 'Verlierer R4',
  'bracket.match': 'Spiel {n}',
  'bracket.matchThird': 'Spiel {n} (3./4.)',
  'bracket.matchFinal': 'Spiel {n} (1./2.)',
  'bracket.saveImage': 'Als Bild speichern',
  'bracket.reset': 'Zurücksetzen',

  'standings.unavailable': 'Rangliste-Daten nicht verfügbar',
  'standings.loadError': 'Fehler beim Laden der Rangliste',
  'standings.empty': 'Keine Rangliste-Daten verfügbar',

  'refresh.done': 'Aktualisiert!',
  'updated.prefix': 'Aktualisiert',
  'error.loadData': 'Daten momentan nicht erreichbar – zeige letzten Stand.',
}

const en: typeof de = {
  'brand.tagline': 'Tournament',
  'nav.allGames': 'All games',
  'nav.tableau': 'Tableau',
  'nav.refresh': 'Refresh',
  'nav.back': 'Back to home',
  'nav.admin': 'Admin',
  'nav.home': 'Home',

  'settings.heading': 'Settings',
  'settings.courtCount': 'Number of courts',
  'settings.courtCountHint': '0 = automatic from data',
  'settings.refresh': 'Auto-refresh (seconds)',
  'settings.tournaments': 'Tournaments shown',
  'settings.men': 'Men',
  'settings.women': 'Women',
  'settings.defaultLang': 'Default language',
  'settings.notes': 'Notes',
  'settings.notesDe': 'Notes (DE)',
  'settings.notesEn': 'Notes (EN)',
  'settings.notesHint': 'Shown on the start page.',
  'settings.notesPlaceholder': 'e.g. Sets 1–2: to 21, set 3: to 15. Free up courts 5 & 6 after 15:00.',
  'settings.save': 'Save',
  'settings.saved': 'Saved!',
  'settings.reset': 'Reset',

  'admin.heading': 'Admin',
  'admin.pinLabel': 'Enter PIN',
  'admin.unlock': 'Unlock',
  'admin.wrongPin': 'Wrong PIN',
  'admin.lock': 'Lock',
  'admin.notConfigured': 'ADMIN_PIN is not set (Cloudflare Pages → Settings → Environment variables).',
  'admin.scoresHeading': 'Scores',
  'admin.scoresHint': 'Enter court & set scores — result, bracket & standings update automatically.',
  'admin.courtLabel': 'Court',
  'admin.loadingScores': 'Loading matches…',
  'admin.noScores': 'No matches to edit.',
  'admin.saveError': 'Error saving',
  'admin.partialSet': 'Please enter both set scores.',
  'admin.invalidSet': 'Invalid set (to {target}, win by 2).',
  'admin.set3Locked': 'Set 3 only opens at 1–1.',
  'admin.sessionExpired': 'Session expired — please log in again.',

  'court.free': 'Free',
  'court.noCourts': 'No courts available',
  'court.noMatchesScheduled': 'No matches scheduled',

  'heading.tableau': 'Tableau & standings',
  'heading.allGames': 'All games',
  'heading.courts': 'Courts',

  'loading.matches': 'Loading match data…',
  'loading.tableau': 'Loading tableau data…',
  'loading.allGames': 'Loading all games…',

  'empty.noMatchesTitle': 'No matches available',
  'empty.noMatchesIndex': 'No matches are currently scheduled.',
  'empty.noMatchesAllGames': 'There are currently no scheduled matches.',
  'empty.noDataTitle': 'No data available',
  'empty.noDataBody': 'No tableau data could be loaded.',

  'filter.tournament': 'Tournament',
  'filter.team': 'Team',
  'filter.teamAll': 'All teams',
  'filter.teamClear': 'Clear filter',
  'empty.teamNotScheduled': '{team} has no current match and none scheduled next.',
  'empty.teamNoGames': 'No games for {team}.',
  'empty.teamNoPath': 'No tableau games for {team} yet.',
  'tabs.bracket': 'Bracket',
  'tabs.standings': 'Standings',
  'footer.copyright': '© 2026 ZuZu Beach Tournament Kloten',

  'court.label': 'Court {n}',
  'slot.current': 'Current',
  'slot.next': 'Next',
  'slot.live': 'Live',

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
  'bracket.finals': 'Final',
  'bracket.thirdPlace': '3rd/4th',
  'bracket.loserR1': 'Loser R1',
  'bracket.loserR2': 'Loser R2',
  'bracket.loserR3': 'Loser R3',
  'bracket.loserR4': 'Loser R4',
  'bracket.match': 'Match {n}',
  'bracket.matchThird': 'Match {n} (3rd/4th)',
  'bracket.matchFinal': 'Match {n} (1st/2nd)',
  'bracket.saveImage': 'Save as image',
  'bracket.reset': 'Reset',

  'standings.unavailable': 'Standings data unavailable',
  'standings.loadError': 'Error loading standings',
  'standings.empty': 'No standings data available',

  'refresh.done': 'Refreshed!',
  'updated.prefix': 'Updated',
  'error.loadData': 'Data currently unavailable — showing last state.',
}

const stored = (() => {
  try {
    return localStorage.getItem('zuzu-lang')
  } catch {
    return null
  }
})()
const lng = stored === 'de' || stored === 'en' ? stored : getSettings().defaultLang

i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng,
  fallbackLng: 'de',
  interpolation: { escapeValue: false, prefix: '{', suffix: '}' },
})

export function setLang(lang: 'de' | 'en') {
  try {
    localStorage.setItem('zuzu-lang', lang)
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang
  i18n.changeLanguage(lang)
}

export default i18n
