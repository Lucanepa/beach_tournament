import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { CalendarX, Info, Maximize, Minimize, UserX } from 'lucide-react'
import { useTournaments } from '@/lib/useTournament'
import { getSettings } from '@/lib/settings'
import { getNotes } from '@/lib/api'
import { matchHasTeam, scheduleCompare, teamNames, type Match } from '@/lib/tournament'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TeamFilter } from '@/components/TeamFilter'

function MatchSlot({ match, type, highlight }: { match: Match; type: 'current' | 'next'; highlight?: string | null }) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'rounded-lg bg-white/95 p-3 text-foreground shadow-sm',
        type === 'current' ? 'border-l-4 border-coral now-playing' : 'border-l-4 border-ocean'
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <Badge variant={type === 'current' ? 'default' : 'ocean'}>
          {type === 'current' ? t('slot.current') : t('slot.next')}
        </Badge>
        <span className="text-xs font-bold text-ocean-dark">{match.sex}</span>
      </div>
      <div className="space-y-1">
        {[match.team1.teamName, match.team2.teamName].map((name, i) => {
          const isTeam = highlight && name.trim() === highlight.trim()
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-coral text-[11px] font-bold text-white">
                {i === 0 ? 'A' : 'B'}
              </span>
              <span className={cn('truncate text-sm font-semibold text-navy', isTeam && 'rounded bg-sun/25 px-1 font-extrabold text-sun-dark')}>
                {name}
              </span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        {match.time && match.time !== 'TBD' ? (
          <span className="font-bold text-navy">{match.time}</span>
        ) : (
          <span />
        )}
        <span className="rounded bg-secondary px-1.5 py-0.5 font-semibold">
          {t('match.label', { n: match.matchNumber || '–' })}
        </span>
      </div>
    </div>
  )
}

function CourtCard({ court, matches, index, highlight }: { court: string; matches: Match[]; index: number; highlight?: string | null }) {
  const { t } = useTranslation()
  const sorted = [...matches].sort(scheduleCompare)
  const current = sorted.find((m) => m.status === 'open')
  const next = sorted.find((m) => m.status === 'upcoming')
  const hasMen = matches.some((m) => m.sex === 'M')
  const hasWomen = matches.some((m) => m.sex === 'F')
  const tone = hasMen && !hasWomen ? 'men' : hasWomen && !hasMen ? 'women' : hasMen ? 'men' : 'none'
  const courtNum = court.replace('Court ', '')

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
      className={cn(
        'overflow-hidden rounded-xl border p-5 shadow-[0_1px_2px_-1px_rgba(28,25,23,0.06),0_6px_20px_-8px_rgba(28,25,23,0.12)] transition-shadow',
        tone === 'men' && 'border-ocean-dark bg-gradient-to-br from-navy to-ocean text-white',
        tone === 'women' && 'border-coral-dark bg-gradient-to-br from-coral to-sun text-white',
        tone === 'none' && 'border-border bg-card opacity-70'
      )}
    >
      <div className="mb-4 flex items-center gap-3 border-b border-white/20 pb-3">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-full text-lg font-extrabold',
            tone === 'none' ? 'bg-coral text-white' : 'bg-white/90 text-navy'
          )}
        >
          {courtNum}
        </span>
        <span className={cn('text-lg font-bold uppercase tracking-tight', tone === 'none' && 'text-navy')}>
          {t('court.label', { n: courtNum })}
        </span>
      </div>

      <div className="space-y-3">
        {!current && (
          <div className="inline-block rounded-full border border-dashed border-current/40 px-3 py-0.5 text-xs font-bold uppercase tracking-wide opacity-80">
            {t('court.free')}
          </div>
        )}
        {current && <MatchSlot match={current} type="current" highlight={highlight} />}
        {next && <MatchSlot match={next} type="next" highlight={highlight} />}
        {!current && !next && (
          <p className={cn('py-2 text-sm italic', tone === 'none' ? 'text-muted-foreground' : 'text-white/90')}>
            {t('court.noMatchesScheduled')}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// Spectator QR card — links phones to this very site for live scores. Lives in
// its own right-hand column (see the page layout) and is vertically centred
// against the courts grid, so it sits level with the midpoint between the
// men's and women's courts rather than pinned to the top.
function SideQR() {
  const { t } = useTranslation()
  const url = typeof window !== 'undefined' ? window.location.origin : ''
  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-border bg-card/90 p-3 text-center shadow-[0_1px_2px_-1px_rgba(28,25,23,0.06),0_6px_20px_-8px_rgba(28,25,23,0.12)] backdrop-blur">
      <span className="text-xs font-extrabold uppercase tracking-widest text-coral">{t('qr.title')}</span>
      <div className="rounded-lg bg-white p-2">
        <QRCodeSVG value={url} size={108} bgColor="#ffffff" fgColor="#16233f" level="M" />
      </div>
      <span className="text-[11px] font-semibold leading-tight text-muted-foreground">{t('qr.subtitle')}</span>
    </div>
  )
}

// Kiosk fullscreen toggle — handy when this runs on a venue display.
function FullscreenToggle() {
  const { t } = useTranslation()
  const [isFs, setIsFs] = useState(false)
  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.()
  }
  return (
    <button
      onClick={toggle}
      title={isFs ? t('fullscreen.exit') : t('fullscreen.enter')}
      className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-navy backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      {isFs ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
      <span className="hidden sm:inline">{isFs ? t('fullscreen.exit') : t('fullscreen.enter')}</span>
    </button>
  )
}

export default function Courts() {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useTournaments()
  const settings = getSettings()
  const useMen = settings.tournaments.includes('men')
  const useWomen = settings.tournaments.includes('women')
  const lang = i18n.language?.startsWith('en') ? 'en' : 'de'

  // Organizer notes live server-side (shared across devices). They change rarely,
  // so poll on a slow cadence independent of the match-data refresh.
  const [notes, setNotes] = useState({ notesDe: '', notesEn: '' })
  useEffect(() => {
    let alive = true
    const load = () => getNotes().then((n) => alive && setNotes(n))
    load()
    const id = setInterval(load, 60_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])
  const note = lang === 'en' ? notes.notesEn || notes.notesDe : notes.notesDe || notes.notesEn

  const [team, setTeam] = useState<string | null>(null)

  const men = data?.men
  const women = data?.women

  let courts: string[]
  if (settings.courtCount > 0) {
    courts = Array.from({ length: settings.courtCount }, (_, i) => `Court ${i + 1}`)
  } else {
    const all = [...(useMen ? men?.courts || [] : []), ...(useWomen ? women?.courts || [] : [])]
    courts = [...new Set(all)].sort(
      (a, b) => (parseInt(a.replace('Court ', '')) || 0) - (parseInt(b.replace('Court ', '')) || 0)
    )
  }

  const matchesForCourt = (court: string) => [
    ...(useMen ? (men?.matches || []).filter((m) => m.court === court) : []),
    ...(useWomen ? (women?.matches || []).filter((m) => m.court === court) : []),
  ]

  // Team picker spans both tournaments; selecting one keeps only the courts
  // where that team is currently playing or up next.
  const teams = teamNames([
    ...(useMen ? men?.matches || [] : []),
    ...(useWomen ? women?.matches || [] : []),
  ])
  const shownCourts = team
    ? courts.filter((court) => {
        const sorted = matchesForCourt(court).sort(scheduleCompare)
        const current = sorted.find((m) => m.status === 'open')
        const next = sorted.find((m) => m.status === 'upcoming')
        return (current && matchHasTeam(current, team)) || (next && matchHasTeam(next, team))
      })
    : courts

  return (
    <div>
      <section className="aurora relative mb-8 overflow-hidden rounded-2xl border border-border p-8 text-center">
        <FullscreenToggle />
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-navy sm:text-4xl">
          ZuZu Beach
        </h1>
        <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-ocean-dark">
          {t('heading.courts')}
        </p>
      </section>

      {note && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-border border-l-4 border-l-coral bg-card p-4 shadow-[0_1px_2px_-1px_rgba(28,25,23,0.06),0_6px_20px_-8px_rgba(28,25,23,0.12)]">
          <Info className="mt-0.5 size-5 shrink-0 text-coral" />
          <p className="whitespace-pre-line text-sm font-medium text-navy">{note}</p>
        </div>
      )}

      {!isLoading && courts.length > 0 && (
        <TeamFilter teams={teams} value={team} onChange={setTeam} />
      )}

      {/* Courts grid + spectator QR share one row; the QR is vertically centred
          against the grid so it lands level with the men's/women's midpoint. */}
      <div className="lg:flex lg:items-stretch lg:gap-6">
        <div className="lg:min-w-0 lg:flex-1">
          {isLoading && !data ? (
            <p className="py-12 text-center text-muted-foreground">{t('loading.matches')}</p>
          ) : courts.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarX className="mx-auto mb-3 size-12 text-border" />
              <h3 className="text-xl font-bold uppercase text-navy">{t('court.noCourts')}</h3>
              <p className="text-muted-foreground">{t('empty.noMatchesIndex')}</p>
            </div>
          ) : shownCourts.length === 0 ? (
            <div className="py-16 text-center">
              <UserX className="mx-auto mb-3 size-12 text-border" />
              <h3 className="text-xl font-bold uppercase text-navy">{team}</h3>
              <p className="text-muted-foreground">{t('empty.teamNotScheduled', { team })}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {shownCourts.map((court, i) => (
                <CourtCard key={court} court={court} matches={matchesForCourt(court)} index={i} highlight={team} />
              ))}
            </div>
          )}
        </div>

        <aside className="mt-6 hidden shrink-0 self-stretch lg:mt-0 lg:flex lg:w-36 lg:items-center">
          <SideQR />
        </aside>
      </div>
    </div>
  )
}
