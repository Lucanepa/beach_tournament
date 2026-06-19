import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { MapPin, Clock, Hash, Trophy, CalendarX } from 'lucide-react'
import { useTournaments } from '@/lib/useTournament'
import { useSelectedTournament } from '@/lib/useSelectedTournament'
import { matchHasTeam, teamNames, type Match } from '@/lib/tournament'
import { TournamentSwitcher } from '@/components/TournamentSwitcher'
import { TeamFilter } from '@/components/TeamFilter'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

function statusBadge(m: Match, t: (k: string) => string) {
  if (m.status === 'concluded') return <Badge variant="success">{t('status.completed')}</Badge>
  if (m.status === 'open') return <Badge variant="default">{t('status.inProgress')}</Badge>
  return <Badge variant="ocean">{t('status.upcoming')}</Badge>
}

function MatchCard({ match, index, highlight }: { match: Match; index: number; highlight?: string | null }) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border border-l-4 border-l-coral bg-card p-5 shadow-[0_1px_2px_-1px_rgba(28,25,23,0.06),0_6px_20px_-8px_rgba(28,25,23,0.12)] sm:flex-row sm:items-center sm:justify-between',
        highlight && 'border-l-sun ring-1 ring-sun/40'
      )}
    >
      <div className="flex-1 space-y-2">
        {[match.team1.teamName, match.team2.teamName].map((name, i) => {
          const isTeam = highlight && name.trim() === highlight.trim()
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white">
                {i === 0 ? 'A' : 'B'}
              </span>
              <span className={cn('text-lg font-semibold text-navy', isTeam && 'rounded bg-sun/20 px-1.5 font-extrabold text-sun-dark')}>
                {name}
              </span>
            </div>
          )
        })}
        {match.status === 'concluded' && match.score && (
          <p className="pl-9 text-sm font-bold tracking-wide text-muted-foreground">{match.score}</p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ocean px-3 py-1 text-sm font-semibold text-white">
            <MapPin className="size-3.5" /> {match.court}
          </span>
          {match.time && match.time !== 'TBD' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-sm font-semibold text-white">
              <Clock className="size-3.5" /> {match.time}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Hash className="size-3.5" /> {match.matchNumber}
          </span>
          <span className="inline-flex items-center gap-1">
            <Trophy className="size-3.5" /> {t('match.round', { n: match.round })}
          </span>
          <span className="font-bold text-ocean-dark">{match.sex}</span>
          {statusBadge(match, t)}
        </div>
      </div>
    </motion.div>
  )
}

export default function AllGames() {
  const { t } = useTranslation()
  const [sel, setSel] = useSelectedTournament()
  const { data, isLoading } = useTournaments()
  const [team, setTeam] = useState<string | null>(null)

  const allMatches = data?.[sel]?.matches || []
  // Reset the team filter when switching tournaments — the team lists differ.
  useEffect(() => setTeam(null), [sel])

  const teams = teamNames(allMatches)
  const matches = allMatches
    .filter((m) => m.court && m.court !== 'TBD')
    .filter((m) => !team || matchHasTeam(m, team))
    .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0) || (a.rowIndex || 0) - (b.rowIndex || 0))

  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold uppercase tracking-tight text-navy">{t('heading.allGames')}</h1>
      <TournamentSwitcher value={sel} onChange={setSel} />
      <TeamFilter teams={teams} value={team} onChange={setTeam} />

      {isLoading && !data ? (
        <p className="py-12 text-center text-muted-foreground">{t('loading.allGames')}</p>
      ) : matches.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarX className="mx-auto mb-3 size-12 text-border" />
          <h3 className="text-xl font-bold uppercase text-navy">{t('empty.noMatchesTitle')}</h3>
          <p className="text-muted-foreground">
            {team ? t('empty.teamNoGames', { team }) : t('empty.noMatchesAllGames')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m, i) => (
            <MatchCard key={m.id} match={m} index={i} highlight={team} />
          ))}
        </div>
      )}
    </div>
  )
}
