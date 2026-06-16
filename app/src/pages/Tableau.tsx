import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toPng } from 'html-to-image'
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react'
import { useTournaments } from '@/lib/useTournament'
import { useSelectedTournament } from '@/lib/useSelectedTournament'
import { tournamentLabel, type Match } from '@/lib/tournament'
import { TournamentSwitcher } from '@/components/TournamentSwitcher'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Columns ordered so the FINAL sits in the centre: winners flow in from the
// left, losers flow in from the right, finals in the middle.
const COLUMNS: { key: string; nums: number[] }[] = [
  { key: 'bracket.roundI', nums: [1, 2, 3, 4, 5, 6, 7, 8] },
  { key: 'bracket.winnerR1', nums: [13, 14, 15, 16] },
  { key: 'bracket.winnerR2', nums: [21, 22] },
  { key: 'bracket.semifinals', nums: [27, 28] },
  { key: 'bracket.finals', nums: [30, 29] },
  { key: 'bracket.loserR4', nums: [25, 26] },
  { key: 'bracket.loserR3', nums: [23, 24] },
  { key: 'bracket.loserR2', nums: [17, 18, 19, 20] },
  { key: 'bracket.loserR1', nums: [9, 10, 11, 12] },
]

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

function BracketMatch({ match, num }: { match?: Match; num: number }) {
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
  return (
    <div className={cn('relative rounded-lg border bg-card p-2 pt-3 shadow-sm', isFinal ? 'border-sun bg-[#fffaf0]' : 'border-border')}>
      <span className={cn('absolute -top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-white', isFinal ? 'bg-sun text-navy' : 'bg-coral')}>
        {label}
      </span>
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
  const [zoom, setZoom] = useState(0.85)
  const [busy, setBusy] = useState(false)

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
            <div className="flex items-stretch gap-4">
              {COLUMNS.map((col) => {
                const isFinalCol = col.key === 'bracket.finals'
                return (
                  <div key={col.key} className={cn('flex w-40 shrink-0 flex-col', isFinalCol && 'w-44')}>
                    <div className={cn('mb-3 text-center text-xs font-bold uppercase tracking-wide', isFinalCol ? 'text-coral' : 'text-muted-foreground')}>
                      {t(col.key)}
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-3">
                      {col.nums.map((n) => (
                        <BracketMatch key={n} match={byNum.get(n)} num={n} />
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
    <div>
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
            <Bracket matches={td?.matches || []} label={tournamentLabel(sel, lang)} />
          </TabsContent>
          <TabsContent value="standings">
            <Standings rows={td?.standings || []} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
