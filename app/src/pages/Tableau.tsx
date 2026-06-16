import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTournaments } from '@/lib/useTournament'
import { availableTournaments, type Match } from '@/lib/tournament'
import { TournamentSwitcher } from '@/components/TournamentSwitcher'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const ROUNDS: { key: string; range: [number, number] }[] = [
  { key: 'bracket.roundI', range: [1, 8] },
  { key: 'bracket.winnerR1', range: [13, 16] },
  { key: 'bracket.winnerR2', range: [21, 22] },
  { key: 'bracket.semifinals', range: [27, 28] },
  { key: 'bracket.finals', range: [29, 30] },
  { key: 'bracket.loserR1', range: [9, 12] },
  { key: 'bracket.loserR2', range: [17, 20] },
  { key: 'bracket.loserR3', range: [23, 24] },
  { key: 'bracket.loserR4', range: [25, 26] },
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
    num === 29 ? t('bracket.matchThird', { n: num }) : num === 30 ? t('bracket.matchFinal', { n: num }) : t('bracket.match', { n: num })
  const win1 = s1 !== '-' && s2 !== '-' && Number(s1) > Number(s2)
  const win2 = s1 !== '-' && s2 !== '-' && Number(s2) > Number(s1)
  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card p-2 pt-3 shadow-sm',
        isFinal ? 'border-sun bg-[#fffaf0]' : 'border-border'
      )}
    >
      <span
        className={cn(
          'absolute -top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-white',
          isFinal ? 'bg-sun text-navy' : 'bg-coral'
        )}
      >
        {label}
      </span>
      {[
        { name: match?.team1?.teamName || 'TBD', s: s1, win: win1 },
        { name: match?.team2?.teamName || 'TBD', s: s2, win: win2 },
      ].map((row, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs',
            row.win ? 'font-bold text-success' : 'text-foreground'
          )}
        >
          <span className="truncate">{row.name}</span>
          <span className="font-bold tabular-nums">{row.s}</span>
        </div>
      ))}
    </div>
  )
}

function Bracket({ matches }: { matches: Match[] }) {
  const { t } = useTranslation()
  if (matches.length === 0) return <p className="py-12 text-center italic text-muted-foreground">{t('bracket.empty')}</p>
  const byNum = new Map(matches.map((m) => [m.matchNumber, m]))
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex w-max gap-4">
        {ROUNDS.map((round) => {
          const nums: number[] = []
          for (let n = round.range[0]; n <= round.range[1]; n++) nums.push(n)
          return (
            <div key={round.key} className="flex w-36 shrink-0 flex-col gap-3">
              <div className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t(round.key)}
              </div>
              {nums.map((n) => (
                <BracketMatch key={n} match={byNum.get(n)} num={n} />
              ))}
            </div>
          )
        })}
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
              <th
                key={i}
                className="whitespace-nowrap border-b-2 border-border bg-secondary px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground"
              >
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
  const { t } = useTranslation()
  const avail = availableTournaments()
  const [sel, setSel] = useState(avail[0] || 'men')
  const { data, isLoading } = useTournaments()
  const td = data?.[sel]

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
            <Bracket matches={td?.matches || []} />
          </TabsContent>
          <TabsContent value="standings">
            <Standings rows={td?.standings || []} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
