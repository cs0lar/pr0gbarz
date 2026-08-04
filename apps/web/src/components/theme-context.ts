import { createContext, useContext } from 'react'

export type ThemeChoice = 'dark' | 'light' | 'system'

export interface ThemeContextValue {
  setTheme: (theme: ThemeChoice) => void
  theme: ThemeChoice
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider.')
  return context
}
