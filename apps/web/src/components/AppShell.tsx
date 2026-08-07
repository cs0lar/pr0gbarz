import { Button, IconButton } from '@pr0gbarz/ui'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'

import { Icon, type IconName } from './icons.js'
import { useTheme } from './theme-context.js'

const navigation: { icon: IconName; label: string; to: string }[] = [
  { icon: 'dashboard', label: 'Overview', to: '/' },
  { icon: 'projects', label: 'Projects', to: '/projects' },
  { icon: 'archive', label: 'Archive', to: '/archive' },
]

function Wordmark() {
  return (
    <div className="wordmark" aria-label="pr0gbarz">
      <span className="wordmark__bars" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      pr0gbarz
    </div>
  )
}

function ThemeControl() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="theme-control" aria-label="Colour theme">
      {(['light', 'system', 'dark'] as const).map((choice) => (
        <button
          aria-pressed={theme === choice}
          key={choice}
          onClick={() => {
            setTheme(choice)
          }}
          type="button"
        >
          {choice === 'system' ? 'Auto' : choice}
        </button>
      ))}
    </div>
  )
}

function ThemeQuickToggle() {
  const { setTheme, theme } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <IconButton
      aria-label={`Use ${next} theme`}
      onClick={() => {
        setTheme(next)
      }}
    >
      <Icon name={next === 'dark' ? 'moon' : 'sun'} />
    </IconButton>
  )
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine)
    }
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return online
}

export function AppShell() {
  const online = useOnlineStatus()
  const navigate = useNavigate()

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Wordmark />
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'active' : undefined)}
              end={item.to === '/'}
              key={item.to}
              to={item.to}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <ThemeControl />
          <p>pr0gbarz 2.0</p>
        </div>
      </aside>

      <div className="app-column">
        {!online ? (
          <div className="offline-banner" role="status">
            You’re offline. Changes will be available when the connection
            returns.
          </div>
        ) : null}
        <header className="topbar">
          <div className="mobile-brand">
            <Wordmark />
          </div>
          <div className="topbar__actions">
            <ThemeQuickToggle />
            <Button
              className="desktop-create"
              onClick={() => {
                void navigate('/projects?create=1')
              }}
              size="compact"
            >
              <Icon name="plus" />
              New project
            </Button>
          </div>
        </header>
        <main className="page" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <NavLink
            className={({ isActive }) => (isActive ? 'active' : undefined)}
            end={item.to === '/'}
            key={item.to}
            to={item.to}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
