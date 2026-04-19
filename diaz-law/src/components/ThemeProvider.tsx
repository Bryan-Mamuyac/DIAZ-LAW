'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme,   setTheme]   = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Clear any old theme keys from previous versions
    localStorage.removeItem('theme')

    const saved = localStorage.getItem('diazlaw-theme') as Theme | null
    // Only go dark if user explicitly chose dark
    const resolved: Theme = saved === 'dark' ? 'dark' : 'light'

    setTheme(resolved)
    // Remove dark class first, then add only if needed
    document.documentElement.classList.remove('dark')
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark')
    }
    setMounted(true)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('diazlaw-theme', next)
    document.documentElement.classList.remove('dark')
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    }
  }

  return (
    <ThemeContext.Provider value={{ theme: mounted ? theme : 'light', toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
