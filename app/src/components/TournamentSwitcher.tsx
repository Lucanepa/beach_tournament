import { useTranslation } from 'react-i18next'
import { availableTournaments, tournamentLabel } from '@/lib/tournament'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export function TournamentSwitcher({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const { t, i18n } = useTranslation()
  const avail = availableTournaments()
  if (avail.length <= 1) return null
  const lang = i18n.language?.startsWith('en') ? 'en' : 'de'
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t('filter.tournament')}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {avail.map((k) => (
            <SelectItem key={k} value={k}>
              {tournamentLabel(k, lang)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
