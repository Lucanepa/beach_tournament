import { Outlet, NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { setLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function LangToggle() {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('en') ? 'en' : 'de'
  return (
    <div className="inline-flex gap-0.5 rounded-full border border-border bg-secondary p-0.5">
      {(['de', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            'min-w-10 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide transition-colors',
            lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-colors',
    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
  )

export default function Layout() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b-[3px] border-primary bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/ZuZU.png" alt="ZuZu Beach" className="h-9 w-auto rounded" />
            <span className="hidden text-lg font-extrabold uppercase tracking-wider text-navy sm:block">
              {t('brand.tagline')}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={navCls} end>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/games" className={navCls}>
              {t('nav.allGames')}
            </NavLink>
            <NavLink to="/tableau" className={navCls}>
              {t('nav.tableau')}
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <NavLink
              to="/admin"
              title="Admin"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Settings className="size-4" />
            </NavLink>
          </div>
        </div>
        <nav className="flex items-center justify-center gap-1 border-t border-border/60 px-4 py-1.5 md:hidden">
          <NavLink to="/" className={navCls} end>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/games" className={navCls}>
            {t('nav.allGames')}
          </NavLink>
          <NavLink to="/tableau" className={navCls}>
            {t('nav.tableau')}
          </NavLink>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">{t('footer.copyright')}</footer>
    </div>
  )
}
