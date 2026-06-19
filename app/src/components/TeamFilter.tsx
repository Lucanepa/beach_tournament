import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

// Radix Select can't hold an empty-string value, so the "no filter" entry uses
// a sentinel that the caller never sees — onChange emits null instead.
const ALL = '__all_teams__'

export function TeamFilter({
  teams,
  value,
  onChange,
  className,
}: {
  teams: string[]
  value: string | null
  onChange: (v: string | null) => void
  className?: string
}) {
  const { t } = useTranslation()
  if (teams.length === 0) return null
  return (
    <div className={className ?? 'mb-6 flex items-center gap-2'}>
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? null : v)}>
        <SelectTrigger className="w-64 max-w-full">
          <SelectValue placeholder={t('filter.teamAll')} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>{t('filter.teamAll')}</SelectItem>
          {teams.map((tm) => (
            <SelectItem key={tm} value={tm}>
              {tm}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <Button variant="ghost" size="icon" onClick={() => onChange(null)} aria-label={t('filter.teamClear')}>
          <X />
        </Button>
      )}
    </div>
  )
}
