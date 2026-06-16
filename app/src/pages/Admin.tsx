import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Lock, Volleyball, SlidersHorizontal } from 'lucide-react'
import { adminLogin, setToken, clearToken, tokenValid, updateScore } from '@/lib/api'
import { useTournaments } from '@/lib/useTournament'
import { availableTournaments, type Match } from '@/lib/tournament'
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import { setLang } from '@/lib/i18n'
import { TournamentSwitcher } from '@/components/TournamentSwitcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t } = useTranslation()
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    const r = await adminLogin(pin)
    setBusy(false)
    if (r.ok && r.token) {
      setToken(r.token)
      onUnlock()
    } else {
      setErr(r.error === 'not_configured' ? t('admin.notConfigured') : t('admin.wrongPin'))
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-12 flex max-w-sm flex-col items-center gap-4 text-center">
      <Lock className="size-8 text-coral" />
      <Label htmlFor="pin">{t('admin.pinLabel')}</Label>
      <Input
        id="pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="max-w-[220px] text-center text-xl tracking-[0.3em]"
      />
      {err && <p className="text-sm font-semibold text-destructive">{err}</p>}
      <Button type="submit" disabled={busy} className="w-full max-w-[220px]">
        {t('admin.unlock')}
      </Button>
    </form>
  )
}

function ScoreRow({
  match,
  tournament,
  onExpired,
}: {
  match: Match
  tournament: string
  onExpired: () => void
}) {
  const { t } = useTranslation()
  const [court, setCourt] = useState(match.courtRaw === '' ? '' : String(match.courtRaw))
  const [sets, setSets] = useState<string[][]>(() =>
    match.sets.map((p) => [p[0] === '' ? '' : String(p[0]), p[1] === '' ? '' : String(p[1])])
  )
  const [status, setStatus] = useState<{ msg: string; kind: 'ok' | 'error' | '' }>({ msg: '', kind: '' })
  const [saving, setSaving] = useState(false)

  const setCell = (si: number, ti: number, v: string) =>
    setSets((prev) => prev.map((p, i) => (i === si ? (ti === 0 ? [v, p[1]] : [p[0], v]) : p)))

  async function save() {
    const out: ([number, number] | null)[] = []
    for (let i = 0; i < 3; i++) {
      const a = sets[i][0].trim()
      const b = sets[i][1].trim()
      if (a === '' && b === '') {
        out.push(null)
        continue
      }
      if (a === '' || b === '') {
        setStatus({ msg: t('admin.partialSet'), kind: 'error' })
        return
      }
      out.push([parseInt(a, 10), parseInt(b, 10)])
    }
    while (out.length && out[out.length - 1] === null) out.pop()
    const courtVal: number | '' = court.trim() === '' ? '' : parseInt(court, 10)

    setSaving(true)
    setStatus({ msg: '…', kind: '' })
    const r = await updateScore({ tournament, matchNumber: match.matchNumber, sets: out, court: courtVal })
    setSaving(false)
    if (r.status === 401) {
      onExpired()
      return
    }
    if (r.ok) setStatus({ msg: t('settings.saved'), kind: 'ok' })
    else setStatus({ msg: t('admin.saveError'), kind: 'error' })
  }

  return (
    <Card className="border-l-4 border-l-coral">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
          <span className="rounded bg-coral px-1.5 py-0.5 text-xs font-bold text-white">#{match.matchNumber}</span>
          {match.round && match.round !== 'TBD' && (
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{match.round}</span>
          )}
          <label className="ml-auto inline-flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ocean-dark">{t('admin.courtLabel')}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={50}
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              className="h-10 w-16 px-2 text-center"
            />
          </label>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_56px_56px_56px] items-center gap-x-2 gap-y-1.5">
          <span />
          {[1, 2, 3].map((n) => (
            <span key={n} className="text-center text-xs font-bold uppercase text-muted-foreground">
              {n}
            </span>
          ))}
          {[match.team1.teamName, match.team2.teamName].map((name, ti) => (
            <div key={ti} className="contents">
              <span className="truncate pr-2 font-semibold text-navy">{name}</span>
              {[0, 1, 2].map((si) => (
                <Input
                  key={si}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  value={sets[si][ti]}
                  onChange={(e) => setCell(si, ti, e.target.value)}
                  className="h-10 px-1 text-center"
                  aria-label={`Set ${si + 1}`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3">
          {status.msg && (
            <span
              className={cn(
                'text-sm font-semibold',
                status.kind === 'ok' && 'text-success',
                status.kind === 'error' && 'text-destructive'
              )}
            >
              {status.msg}
            </span>
          )}
          <Button size="sm" onClick={save} disabled={saving}>
            {t('settings.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ScoreEditor({ onExpired }: { onExpired: () => void }) {
  const { t } = useTranslation()
  const avail = availableTournaments()
  const [sel, setSel] = useState(avail[0] || 'men')
  const { data, isLoading } = useTournaments()
  const matches = [...(data?.[sel]?.matches || [])].sort((a, b) => a.matchNumber - b.matchNumber)

  return (
    <section className="mb-12">
      <div className="mb-4 border-b-2 border-border pb-2">
        <h2 className="flex items-center gap-2 text-xl font-bold uppercase tracking-tight text-navy">
          <Volleyball className="size-5 text-coral" /> {t('admin.scoresHeading')}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('admin.scoresHint')}</p>
      </div>
      <TournamentSwitcher value={sel} onChange={setSel} />
      {isLoading && !data ? (
        <p className="py-8 text-center italic text-muted-foreground">{t('admin.loadingScores')}</p>
      ) : matches.length === 0 ? (
        <p className="py-8 text-center italic text-muted-foreground">{t('admin.noScores')}</p>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <ScoreRow key={m.id} match={m} tournament={sel} onExpired={onExpired} />
          ))}
        </div>
      )}
    </section>
  )
}

function SettingsPanel() {
  const { t } = useTranslation()
  const s = getSettings()
  const [courtCount, setCourtCount] = useState(String(s.courtCount))
  const [refreshSeconds, setRefreshSeconds] = useState(String(s.refreshSeconds))
  const [tournaments, setTournaments] = useState<string[]>(s.tournaments)
  const [defaultLang, setDefaultLang] = useState<'de' | 'en'>(s.defaultLang)

  const toggle = (k: string) =>
    setTournaments((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))

  function save() {
    const tour = tournaments.length ? tournaments : ['men', 'women']
    saveSettings({
      courtCount: parseInt(courtCount, 10) || 0,
      refreshSeconds: parseInt(refreshSeconds, 10) || 10,
      tournaments: tour,
      defaultLang,
    })
    setLang(defaultLang)
    toast.success(t('settings.saved'))
  }

  return (
    <section className="max-w-lg">
      <div className="mb-4 border-b-2 border-border pb-2">
        <h2 className="flex items-center gap-2 text-xl font-bold uppercase tracking-tight text-navy">
          <SlidersHorizontal className="size-5 text-coral" /> {t('settings.heading')}
        </h2>
      </div>
      <div className="space-y-5">
        <div>
          <Label htmlFor="cc">{t('settings.courtCount')}</Label>
          <Input id="cc" type="number" min={0} max={50} value={courtCount} onChange={(e) => setCourtCount(e.target.value)} className="mt-1 max-w-[220px]" />
          <p className="mt-1 text-xs text-muted-foreground">{t('settings.courtCountHint')}</p>
        </div>
        <div>
          <Label htmlFor="rs">{t('settings.refresh')}</Label>
          <Input id="rs" type="number" min={3} max={600} value={refreshSeconds} onChange={(e) => setRefreshSeconds(e.target.value)} className="mt-1 max-w-[220px]" />
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">{t('settings.tournaments')}</span>
          <div className="mt-2 space-y-1.5">
            {(['men', 'women'] as const).map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={tournaments.includes(k)} onChange={() => toggle(k)} className="size-4 accent-coral" />
                <span>{t(k === 'men' ? 'settings.men' : 'settings.women')}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm font-semibold text-foreground">{t('settings.defaultLang')}</span>
          <div className="mt-2 space-y-1.5">
            {(['de', 'en'] as const).map((l) => (
              <label key={l} className="flex items-center gap-2">
                <input type="radio" name="lang" checked={defaultLang === l} onChange={() => setDefaultLang(l)} className="size-4 accent-coral" />
                <span>{l === 'de' ? 'Deutsch (DE)' : 'English (EN)'}</span>
              </label>
            ))}
          </div>
        </div>
        <Button onClick={save}>{t('settings.save')}</Button>
      </div>
    </section>
  )
}

export default function Admin() {
  const { t } = useTranslation()
  const [unlocked, setUnlocked] = useState(tokenValid())

  function lock() {
    clearToken()
    setUnlocked(false)
  }
  function onExpired() {
    toast.error(t('admin.sessionExpired'))
    lock()
  }

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-navy">{t('admin.heading')}</h1>
        <Button variant="secondary" size="sm" onClick={lock}>
          {t('admin.lock')}
        </Button>
      </div>
      <ScoreEditor onExpired={onExpired} />
      <SettingsPanel />
    </div>
  )
}
