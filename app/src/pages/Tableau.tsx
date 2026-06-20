import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toPng } from 'html-to-image'
import { ZoomIn, ZoomOut, RotateCcw, Download, Clock, MapPin } from 'lucide-react'
import { useTournaments } from '@/lib/useTournament'
import { useSelectedTournament } from '@/lib/useSelectedTournament'
import { matchHasTeam, teamNames, tournamentLabel, type Match } from '@/lib/tournament'
import { TournamentSwitcher } from '@/components/TournamentSwitcher'
import { TeamFilter } from '@/components/TeamFilter'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Semifinals sit dead centre; winners flow in from the left, losers from the
// right. The Final (30) folds back to the LEFT of the semifinals and the 3rd/4th
// (29) to the RIGHT — each alone in its column, so it auto-centres vertically.
const COLUMNS: { key: string; nums: number[] }[] = [
  { key: 'bracket.roundI', nums: [1, 2, 3, 4, 5, 6, 7, 8] },
  { key: 'bracket.winnerR1', nums: [13, 14, 15, 16] },
  { key: 'bracket.winnerR2', nums: [21, 22] },
  { key: 'bracket.finals', nums: [30] },
  { key: 'bracket.semifinals', nums: [27, 28] },
  { key: 'bracket.thirdPlace', nums: [29] },
  { key: 'bracket.loserR4', nums: [25, 26] },
  { key: 'bracket.loserR3', nums: [23, 24] },
  { key: 'bracket.loserR2', nums: [17, 18, 19, 20] },
  // Ordered 12→9 (top→bottom) so the loser R1→R2 advancement lines stay straight.
  { key: 'bracket.loserR1', nums: [12, 11, 10, 9] },
]

// Edges [from, to] drawn as elbow connectors — the WINNER of `from` advances to
// `to`. Loser-drop feeds (a winners-bracket loser falling into the loser bracket,
// and the semifinal losers dropping into the 3rd-place match) are NOT drawn: in
// the centre-final layout they'd span the whole sheet. They're conveyed by the
// "Loser Match #N" labels on the cards instead, exactly like the paper bracket.
const EDGES: [number, number][] = [
  // Winners R1 → R2
  [1, 13], [2, 13], [3, 14], [4, 14], [5, 15], [6, 15], [7, 16], [8, 16],
  // Winners R2 → R3
  [13, 21], [14, 21], [15, 22], [16, 22],
  // Winners R3 → Semifinals
  [21, 27], [22, 28],
  // Losers' bracket final → Semifinals — the cross-bracket feed where a
  // semifinalist's opponent comes from the far loser column, not a neighbour.
  [25, 27], [26, 28],
  // (Semifinals → Final/3rd is drawn separately as the central finals junction.)
  // Losers R1 → R2 (reversed pairing keeps the lines straight given column order)
  [12, 17], [11, 18], [10, 19], [9, 20],
  // Losers R2 → R3
  [17, 23], [18, 23], [19, 24], [20, 24],
  // Losers R3 → R4
  [23, 25], [24, 26],
]

// Min height of each column's match stack. With every column stretched to the
// same height and `justify-around`, each match centres itself between its two
// feeders (centre = H·(k+0.5)/n), so the connectors land as clean brackets.
const COL_STACK_MIN_H = 820

function bracketScores(m?: Match): [string, string] {
  if (!m) return ['-', '-']
  if (m.team1Sets != null && m.team2Sets != null) return [String(m.team1Sets), String(m.team2Sets)]
  if (m.score) {
    const s = String(m.score).trim()
    const simple = s.match(/^(\d+)\s+(\d+)$/)
    if (simple) return [simple[1], simple[2]]
    const all = s.match(/(\d+)\s*<>\s*(\d+)/g)
    if (all && all.length) {
      let a = 0,
        b = 0
      all.forEach((ss) => {
        const x = ss.match(/(\d+)\s*<>\s*(\d+)/)
        if (x) {
          const p = +x[1],
            q = +x[2]
          if (p > q) a++
          else if (q > p) b++
        }
      })
      return [String(a), String(b)]
    }
    const m2 = s.match(/(\d+)[\s:,-]+(\d+)/)
    if (m2) return [m2[1], m2[2]]
  }
  return ['-', '-']
}

function BracketMatch({
  match,
  num,
  hidden,
  highlighted,
}: {
  match?: Match
  num: number
  hidden?: boolean
  highlighted?: boolean
}) {
  const { t } = useTranslation()
  const [s1, s2] = bracketScores(match)
  const isFinal = num === 29 || num === 30
  const label =
    num === 29
      ? t('bracket.matchThird', { n: num })
      : num === 30
        ? t('bracket.matchFinal', { n: num })
        : t('bracket.match', { n: num })
  const win1 = s1 !== '-' && s2 !== '-' && Number(s1) > Number(s2)
  const win2 = s1 !== '-' && s2 !== '-' && Number(s2) > Number(s1)
  const timeStr = match?.time && match.time !== 'TBD' ? match.time : ''
  const courtStr = match?.court && match.court !== 'TBD' ? match.court : ''
  return (
    <div
      data-match={num}
      className={cn(
        'relative rounded-lg border bg-card p-2 pt-3 shadow-sm transition-shadow',
        isFinal ? 'border-sun bg-[#fffaf0]' : 'border-border',
        highlighted && 'border-sun bg-[#fffaf0] shadow-md ring-2 ring-sun',
        hidden && 'invisible'
      )}
    >
      <span className={cn('absolute -top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-white', isFinal ? 'bg-sun text-navy' : 'bg-coral')}>
        {label}
      </span>
      {(timeStr || courtStr) && (
        <div className="mb-1 flex items-center justify-end gap-2 text-[9px] font-medium tabular-nums text-muted-foreground">
          {timeStr && (
            <span className="inline-flex items-center gap-0.5">
              <Clock className="size-2.5" /> {timeStr}
            </span>
          )}
          {courtStr && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="size-2.5" /> {courtStr}
            </span>
          )}
        </div>
      )}
      {[
        { name: match?.team1?.teamName || 'TBD', s: s1, win: win1 },
        { name: match?.team2?.teamName || 'TBD', s: s2, win: win2 },
      ].map((row, i) => (
        <div key={i} className={cn('flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs', row.win ? 'font-bold text-success' : 'text-foreground')}>
          <span className="truncate">{row.name}</span>
          <span className="font-bold tabular-nums">{row.s}</span>
        </div>
      ))}
    </div>
  )
}

function Bracket({ matches, label }: { matches: Match[]; label: string }) {
  const { t } = useTranslation()
  const captureRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.85)
  const [busy, setBusy] = useState(false)
  const [team, setTeam] = useState<string | null>(null)
  const [paths, setPaths] = useState<string[]>([])
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })

  const teams = teamNames(matches)
  // The team's path = the games where its name currently appears, ordered by
  // match number (which follows tournament progression). Connecting consecutive
  // path games draws the team's route — including the loser drop — as one clean
  // gold line, because everything else is hidden.
  const pathNums = team
    ? [...new Set(matches.filter((m) => matchHasTeam(m, team)).map((m) => m.matchNumber).filter(Boolean))].sort(
        (a, b) => a - b
      )
    : []
  const pathSet = new Set(pathNums)

  // Measure card positions (layout px, unaffected by the CSS zoom transform) and
  // build an elbow path for every connector. Without a team filter the structural
  // advancement edges are drawn; with one, only the selected team's path.
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const edges: [number, number][] = team
      ? pathNums.slice(0, -1).map((n, i) => [n, pathNums[i + 1]])
      : EDGES
    const compute = () => {
      const cards = new Map<number, HTMLElement>()
      grid.querySelectorAll<HTMLElement>('[data-match]').forEach((el) => {
        cards.set(Number(el.dataset.match), el)
      })
      const next: string[] = []
      for (const [a, b] of edges) {
        const ea = cards.get(a)
        const eb = cards.get(b)
        if (!ea || !eb) continue
        const ay = ea.offsetTop + ea.offsetHeight / 2
        const by = eb.offsetTop + eb.offsetHeight / 2
        // Exit the source on the side that faces the target, enter the target
        // on the facing side — works for both winner (L→R) and loser (R→L) flow.
        const sx = ea.offsetLeft < eb.offsetLeft ? ea.offsetLeft + ea.offsetWidth : ea.offsetLeft
        const ex = ea.offsetLeft < eb.offsetLeft ? eb.offsetLeft : eb.offsetLeft + eb.offsetWidth
        const mx = (sx + ex) / 2
        next.push(`M ${sx} ${ay} L ${mx} ${ay} L ${mx} ${by} L ${ex} ${by}`)
      }
      // Finals junction (default view): one vertical line linking the two
      // semifinals (27 top → 28 bottom), with the Final and the 3rd/4th place
      // branching off its midpoint, mirrored left/right.
      if (!team) {
        const e27 = cards.get(27)
        const e28 = cards.get(28)
        const e30 = cards.get(30)
        const e29 = cards.get(29)
        if (e27 && e28 && e30 && e29) {
          const xc = e27.offsetLeft + e27.offsetWidth / 2
          const yc = (e27.offsetTop + e27.offsetHeight / 2 + e28.offsetTop + e28.offsetHeight / 2) / 2
          next.push(`M ${xc} ${e27.offsetTop + e27.offsetHeight} L ${xc} ${e28.offsetTop}`)
          next.push(`M ${e30.offsetLeft + e30.offsetWidth} ${yc} L ${e29.offsetLeft} ${yc}`)
        }
      }
      setPaths(next)
      setSvgSize({ w: grid.scrollWidth, h: grid.scrollHeight })
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(grid)
    return () => ro.disconnect()
    // pathNums is derived from matches + team, so those two deps cover it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, team])

  if (matches.length === 0)
    return <p className="py-12 text-center italic text-muted-foreground">{t('bracket.empty')}</p>

  const byNum = new Map(matches.map((m) => [m.matchNumber, m]))

  async function exportPng() {
    if (!captureRef.current) return
    setBusy(true)
    try {
      const url = await toPng(captureRef.current, { backgroundColor: '#fcf8f1', pixelRatio: 2, cacheBust: true })
      const a = document.createElement('a')
      a.href = url
      a.download = `tableau-${label.replace(/\s+/g, '_')}.png`
      a.click()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <TeamFilter teams={teams} value={team} onChange={setTeam} />
      {team && pathNums.length === 0 && (
        <p className="mb-3 text-sm italic text-muted-foreground">{t('empty.teamNoPath', { team })}</p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))} aria-label="Zoom out">
          <ZoomOut />
        </Button>
        <span className="w-14 text-center text-sm font-semibold tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))} aria-label="Zoom in">
          <ZoomIn />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setZoom(0.85)}>
          <RotateCcw /> {t('bracket.reset')}
        </Button>
        <Button variant="sun" size="sm" onClick={exportPng} disabled={busy} className="ml-auto">
          <Download /> {t('bracket.saveImage')}
        </Button>
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-card/40 p-2">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: 'max-content' }}>
          <div ref={captureRef} className="w-max bg-transparent p-4">
            <div className="mb-3 text-center text-sm font-bold uppercase tracking-wide text-navy">{label}</div>
            <div ref={gridRef} className="relative flex items-stretch gap-4">
              <svg
                className="pointer-events-none absolute left-0 top-0"
                width={svgSize.w}
                height={svgSize.h}
                style={{ overflow: 'visible' }}
                aria-hidden
              >
                {paths.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={team ? '#f7a23b' : '#6b7589'}
                    strokeOpacity={team ? 0.95 : 0.45}
                    strokeWidth={team ? 2.5 : 1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
              {COLUMNS.map((col) => {
                const isFinalCol = col.key === 'bracket.finals' || col.key === 'bracket.thirdPlace'
                return (
                  <div key={col.key} className={cn('flex w-40 shrink-0 flex-col', isFinalCol && 'w-44')}>
                    <div className={cn('mb-3 text-center text-xs font-bold uppercase tracking-wide', isFinalCol ? 'text-coral' : 'text-muted-foreground')}>
                      {t(col.key)}
                    </div>
                    <div className="flex flex-1 flex-col justify-around" style={{ minHeight: COL_STACK_MIN_H }}>
                      {col.nums.map((n) => (
                        <BracketMatch
                          key={n}
                          match={byNum.get(n)}
                          num={n}
                          hidden={!!team && !pathSet.has(n)}
                          highlighted={!!team && pathSet.has(n)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Standings({ rows }: { rows: (string | number)[][] }) {
  const { t } = useTranslation()
  if (!rows || rows.length < 2)
    return <p className="py-12 text-center italic text-muted-foreground">{t('standings.empty')}</p>
  const [header, ...body] = rows
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i} className="whitespace-nowrap border-b-2 border-border bg-secondary px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="odd:bg-card even:bg-secondary/40 hover:bg-accent/60">
              {header.map((_, ci) => (
                <td key={ci} className="whitespace-nowrap border-b border-border px-3 py-2 text-navy">
                  {row[ci] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Tableau() {
  const { t, i18n } = useTranslation()
  const [sel, setSel] = useSelectedTournament()
  const { data, isLoading } = useTournaments()
  const td = data?.[sel]
  const lang = i18n.language?.startsWith('en') ? 'en' : 'de'

  return (
    <div className="tableau-landscape">
      <h1 className="mb-6 text-3xl font-extrabold uppercase tracking-tight text-navy">{t('heading.tableau')}</h1>
      <TournamentSwitcher value={sel} onChange={setSel} />

      {isLoading && !data ? (
        <p className="py-12 text-center text-muted-foreground">{t('loading.tableau')}</p>
      ) : (
        <Tabs defaultValue="bracket">
          <TabsList className="mb-6">
            <TabsTrigger value="bracket">{t('tabs.bracket')}</TabsTrigger>
            <TabsTrigger value="standings">{t('tabs.standings')}</TabsTrigger>
          </TabsList>
          <TabsContent value="bracket">
            <Bracket key={sel} matches={td?.matches || []} label={tournamentLabel(sel, lang)} />
          </TabsContent>
          <TabsContent value="standings">
            <Standings rows={td?.standings || []} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
