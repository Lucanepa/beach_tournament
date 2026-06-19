// Data layer — ported from the vanilla script.js. Reads the live Google Sheets
// (xlsx export) and parses the Resultate / Match + Rangliste tabs.
import * as XLSX from 'xlsx'
import { getSettings } from './settings'

export type TournamentKey = string

export type SetPair = [number | '', number | '']

export interface Match {
  id: string
  rowIndex: number
  round: string
  matchNumber: number
  court: string
  courtRaw: number | ''
  time: string
  team1: { teamName: string }
  team2: { teamName: string }
  status: 'upcoming' | 'open' | 'concluded'
  result: string | number | null
  score: string | null
  team1Sets: number | null
  team2Sets: number | null
  sets: SetPair[]
  sex: string
}

export interface TournamentData {
  matches: Match[]
  courts: string[]
  standings: (string | number)[][]
}

export interface DataSource {
  googleId: string | null
  localFile: string
  label: { de: string; en: string } | string
}

export const DATA_SOURCES: Record<string, DataSource> = {
  men: {
    googleId: '1iTfEsqh3IfRWuk-ajwDwyPvAP7wJvIUVLUpvcH-qawM',
    localFile: 'b2m.xlsx',
    label: { de: 'U20 Herren (U20M)', en: 'U20 Men (U20M)' },
  },
  women: {
    googleId: '1yrTfHietiohzpGIVlMJIjzZoNoNeme1sZTdXG50JX4c',
    localFile: 'b3f.xlsx',
    label: { de: 'U20 Damen (U20F)', en: 'U20 Women (U20F)' },
  },
}

export function tournamentLabel(key: string, lang: 'de' | 'en'): string {
  const raw = DATA_SOURCES[key]?.label
  if (raw && typeof raw === 'object') return raw[lang] || raw.de || key
  return (raw as string) || key
}

// Placeholder slot labels that aren't real entrants: "Winner Match #21",
// "Loser Match #22", "Seed #16", "Team 1/2", "TBD". The team picker must only
// offer actual teams.
const PLACEHOLDER_TEAM = /^(?:winner|loser)\s+match\s*#?\s*\d+$|^seed\s*#?\s*\d+$|^team\s*[12]$|^tbd$/i

export function isRealTeam(name?: string | null): boolean {
  const s = (name ?? '').trim()
  return s !== '' && !PLACEHOLDER_TEAM.test(s)
}

/** Distinct real team names found across the given matches, alphabetically. */
export function teamNames(matches: Match[]): string[] {
  const set = new Set<string>()
  for (const m of matches) {
    if (isRealTeam(m.team1?.teamName)) set.add(m.team1.teamName.trim())
    if (isRealTeam(m.team2?.teamName)) set.add(m.team2.teamName.trim())
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}

export function matchHasTeam(m: Match, team: string): boolean {
  const tn = team.trim()
  return m.team1?.teamName?.trim() === tn || m.team2?.teamName?.trim() === tn
}

export function availableTournaments(): string[] {
  const keys = Object.keys(DATA_SOURCES)
  const selected = getSettings().tournaments
  const avail = keys.filter((k) => selected.includes(k))
  return avail.length ? avail : keys
}

function buildDataUrl(key: string, bust = true): string {
  const src = DATA_SOURCES[key] || DATA_SOURCES.men
  const cb = bust ? `cb=${Date.now()}` : ''
  if (src.googleId) {
    return `https://docs.google.com/spreadsheets/d/${src.googleId}/export?format=xlsx${cb ? `&${cb}` : ''}`
  }
  return cb ? `${src.localFile}?${cb}` : src.localFile
}

// ── Schedule ordering: time, then court, then sheet row order ──────
function timeKey(m: Match) {
  return m.time && m.time !== 'TBD' ? m.time : '99:99'
}
function courtNum(m: Match) {
  const n = parseInt(String(m.court || '').replace('Court ', ''), 10)
  return Number.isNaN(n) ? 999 : n
}
export function scheduleCompare(a: Match, b: Match) {
  const t = timeKey(a).localeCompare(timeKey(b))
  if (t !== 0) return t
  const c = courtNum(a) - courtNum(b)
  if (c !== 0) return c
  return (a.rowIndex || 0) - (b.rowIndex || 0)
}

type Layout = 'match' | 'resultate'
const COLS: Record<Layout, Record<string, number | null>> = {
  match: {
    matchNumber: 0, round: 1, court: 2, time: 3, team1: 4, team2: 5,
    result: 6, resultTeam2: 7,
    set1Team1: 9, set1Team2: 10, set2Team1: 11, set2Team2: 12, set3Team1: 13, set3Team2: 14,
    status: 17, sex: 18,
  },
  resultate: {
    matchNumber: 0, round: 1, court: 2, time: 3, team1: 4, team2: 6,
    result: 7, resultTeam2: 9,
    set1Team1: 11, set1Team2: 13, set2Team1: 14, set2Team2: 16, set3Team1: 17, set3Team2: 19,
    status: null, sex: null,
  },
}

function parseMatches(sheet: XLSX.WorkSheet, tournament: string, layout: Layout): Match[] {
  const matches: Match[] = []
  const range = XLSX.utils.decode_range(sheet['!ref'] as string)
  const map = COLS[layout]
  const cell = (row: number, key: string): any => {
    const c = map[key]
    if (c === null || c === undefined) return undefined
    return (sheet[XLSX.utils.encode_cell({ r: row, c })] as any)?.v
  }

  for (let row = 1; row <= range.e.r; row++) {
    const matchNumber = cell(row, 'matchNumber')
    const round = cell(row, 'round')
    const court = cell(row, 'court')
    const time = cell(row, 'time')
    const team1 = cell(row, 'team1')
    const team2 = cell(row, 'team2')
    const result = cell(row, 'result')
    const resultTeam2 = cell(row, 'resultTeam2')
    const status = cell(row, 'status')
    const sex = cell(row, 'sex')

    const s1t1 = cell(row, 'set1Team1'), s1t2 = cell(row, 'set1Team2')
    const s2t1 = cell(row, 'set2Team1'), s2t2 = cell(row, 'set2Team2')
    const s3t1 = cell(row, 'set3Team1'), s3t2 = cell(row, 'set3Team2')

    const setVal = (v: any): number | '' =>
      v === undefined || v === null || v === '' || isNaN(Number(v)) ? '' : Number(v)
    const sets: SetPair[] = [
      [setVal(s1t1), setVal(s1t2)],
      [setVal(s2t1), setVal(s2t2)],
      [setVal(s3t1), setVal(s3t2)],
    ]

    let fullScore = ''
    if ((s1t1 || s1t2) && (s1t1 != 0 || s1t2 != 0)) fullScore += `${s1t1} ${s1t2}`
    if ((s2t1 || s2t2) && (s2t1 != 0 || s2t2 != 0)) fullScore += (fullScore ? ' ' : '') + `${s2t1} ${s2t2}`
    if ((s3t1 || s3t2) && (s3t1 != 0 || s3t2 != 0)) fullScore += (fullScore ? ' ' : '') + `${s3t1} ${s3t2}`

    const isBlank = (v: any) => v === undefined || v === null || String(v).trim() === ''
    if (isBlank(team1) && isBlank(team2) && isBlank(matchNumber)) continue

    let courtFormatted = 'TBD'
    if (court !== null && court !== undefined && court !== '') {
      courtFormatted = court === 0 ? 'TBD' : `Court ${court}`
    }
    const courtRaw: number | '' =
      court === null || court === undefined || court === '' || court === 0 ? '' : Number(court)

    let timeFormatted = 'TBD'
    if (time !== null && time !== undefined && time !== '') {
      if (typeof time === 'number') {
        const hours = Math.floor(time * 24)
        const minutes = Math.round((time * 24 - hours) * 60)
        timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      } else {
        timeFormatted = String(time)
      }
    }

    const hasResult =
      fullScore.trim() !== '' ||
      (result !== undefined && result !== null && result !== '' && result != 0) ||
      (resultTeam2 !== undefined && resultTeam2 !== null && resultTeam2 !== '' && resultTeam2 != 0)

    let matchStatus: Match['status'] = 'upcoming'
    if (status && status.toString().trim() !== '') {
      const s = status.toString().trim().toLowerCase()
      if (s === 'completed') matchStatus = 'concluded'
      else if (s === 'in_progress') matchStatus = 'open'
      else matchStatus = 'upcoming'
    } else if (hasResult) {
      matchStatus = 'concluded'
    }

    matches.push({
      id: `match_${round}_${matchNumber}`,
      rowIndex: row,
      round: round || 'TBD',
      matchNumber: matchNumber || 0,
      court: courtFormatted,
      courtRaw,
      time: timeFormatted,
      team1: { teamName: team1 || 'Team 1' },
      team2: { teamName: team2 || 'Team 2' },
      status: matchStatus,
      result: result || fullScore.trim() || null,
      score: fullScore.trim() || null,
      team1Sets: result !== undefined && result !== null && result !== '' ? result : null,
      team2Sets: resultTeam2 !== undefined && resultTeam2 !== null && resultTeam2 !== '' ? resultTeam2 : null,
      sets,
      sex: sex ? sex.toString().toUpperCase() : tournament === 'men' ? 'M' : 'F',
    })
  }

  // Promote the earliest non-concluded match on each court to "open".
  const groups: Record<string, Match[]> = {}
  matches.forEach((m) => {
    const c = m.court.replace('Court ', '')
    if (c && c !== 'TBD') (groups[c] ||= []).push(m)
  })
  Object.values(groups).forEach((group) => {
    group.sort(scheduleCompare)
    if (!group.some((m) => m.status === 'open')) {
      const cur = group.find((m) => m.status !== 'concluded')
      if (cur) cur.status = 'open'
    }
  })

  return matches
}

export async function loadTournament(key: string): Promise<TournamentData> {
  const res = await fetch(buildDataUrl(key, true), { cache: 'no-store' })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const buf = await res.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })

  let matches: Match[] = []
  if (wb.Sheets['Match']) matches = parseMatches(wb.Sheets['Match'], key, 'match')
  else if (wb.Sheets['Resultate']) matches = parseMatches(wb.Sheets['Resultate'], key, 'resultate')

  const courts = [...new Set(matches.map((m) => m.court).filter((c) => c && c !== 'TBD'))].sort(
    (a, b) => (parseInt(a.replace('Court ', '')) || 0) - (parseInt(b.replace('Court ', '')) || 0)
  )

  let standings: (string | number)[][] = []
  const rang = wb.Sheets['Rangliste']
  if (rang) {
    const rows = XLSX.utils.sheet_to_json(rang, { header: 1 }) as (string | number)[][]
    standings = rows.filter((row, i) => i !== 18 && row && row.some((cell) => cell !== ''))
  }

  return { matches, courts, standings }
}
