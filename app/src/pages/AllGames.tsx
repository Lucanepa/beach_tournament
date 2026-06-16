import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { MapPin, Clock, Hash, Trophy, CalendarX } from 'lucide-react'
import { useTournaments } from '@/lib/useTournament'
import { useSelectedTournament } from '@/lib/useSelectedTournament'
import { scheduleCompare, type Match } from '@/lib/tournament'
import { TournamentSwitcher } from '@/components/TournamentSwitcher'
import { Badge } from '@/components/ui/badge'

function statusBadge(m: Match, t: (k: string) => string) {
  if (m.status === 'concluded') return <Badge variant="success">{t('status.completed')}</Badge>
  if (m.status === 'open') return <Badge variant="default">{t('status.inProgress')}</Badge>
  return <Badge variant="ocean">{t('status.upcoming')}</Badge>
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
      className="flex flex-col gap-4 rounded-xl border border-border border-l-4 border-l-coral bg-card p-5 shadow-[0_1px_2px_-1px_rgba(28,25,23,0.06),0_6px_20px_-8px_rgba(28,25,23,0.12)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex-1 space-y-2">
        {[match.team1.teamName, match.team2.teamName].map((name, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-white">
              {i === 0 ? 'A' : 'B'}
            </span>
            <span className="text-lg font-semibold text-navy">{name}</span>
          </div>
        ))}
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

  const matches = (data?.[sel]?.matches || [])
    .filter((m) => m.court && m.court !== 'TBD')
    .sort(scheduleCompare)

  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold uppercase tracking-tight text-navy">{t('heading.allGames')}</h1>
      <TournamentSwitcher value={sel} onChange={setSel} />

      {isLoading && !data ? (
        <p className="py-12 text-center text-muted-foreground">{t('loading.allGames')}</p>
      ) : matches.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarX className="mx-auto mb-3 size-12 text-border" />
          <h3 className="text-xl font-bold uppercase text-navy">{t('empty.noMatchesTitle')}</h3>
          <p className="text-muted-foreground">{t('empty.noMatchesAllGames')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m, i) => (
            <MatchCard key={m.id} match={m} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
