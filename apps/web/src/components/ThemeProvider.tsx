import { type ReactNode, useEffect, useState } from 'react'

import { ThemeContext, type ThemeChoice } from './theme-context.js'

function initialTheme(): ThemeChoice {
  const stored = localStorage.getItem('pr0gbarz-theme')
  return stored === 'dark' || stored === 'light' ? stored : 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeChoice>(initialTheme)

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme')
      localStorage.removeItem('pr0gbarz-theme')
    } else {
      document.documentElement.dataset.theme = theme
      localStorage.setItem('pr0gbarz-theme', theme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ setTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  )
}
