'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Sun, Moon, Menu, X, Scale } from 'lucide-react'
import { useTheme } from './ThemeProvider'

const NAV = [
  { href: '/',            label: 'Home' },
  { href: '/appointment', label: 'Appointment' },
  { href: '/contact',     label: 'Contact' },
  { href: '/about',       label: 'About' },
]

export function Navbar() {
  const pathname          = usePathname()
  const { theme, toggle } = useTheme()
  const [open,    setOpen]    = useState(false)
  const [mounted, setMounted] = useState(false)

  const isDark = mounted ? theme === 'dark' : false

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => setOpen(false), [pathname])

  const navBg          = isDark ? '#0C1120'                   : '#FFFFFF'
  const navBorder      = isDark ? 'rgba(237,232,222,0.08)'    : 'rgba(10,14,26,0.1)'
  const navShadow      = isDark ? '0 2px 20px rgba(0,0,0,0.4)' : '0 2px 16px rgba(10,14,26,0.07)'
  const toggleColor    = isDark ? 'rgba(237,232,222,0.7)'     : '#6B7280'
  const toggleBg       = isDark ? '#111827'                   : '#F0EDE6'
  const toggleBorder   = isDark ? 'rgba(237,232,222,0.1)'     : 'rgba(10,14,26,0.12)'
  const logoTextColor  = isDark ? '#EDE8DE'                   : '#0A1628'
  const logoSubColor   = isDark ? 'var(--gold)'               : 'var(--gold)'
  const iconBg         = isDark ? 'rgba(201,168,76,0.15)'     : 'rgba(184,146,42,0.1)'

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        background: navBg,
        borderBottom: `1px solid ${navBorder}`,
        boxShadow: navShadow,
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <div className="container-site">
        <div className="flex items-center justify-between h-[68px]">

          {/* ── Text Logo ── */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2.5 group">
            {/* Icon badge */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
              style={{
                background: iconBg,
                border: '1px solid var(--gold-border)',
              }}
            >
              <Scale size={17} style={{ color: 'var(--gold)' }} />
            </div>

            {/* Text */}
            <div className="leading-none">
              <div
                className="font-display font-semibold tracking-wide"
                style={{
                  fontSize: '1rem',
                  color: logoTextColor,
                  letterSpacing: '0.05em',
                  lineHeight: 1.1,
                  transition: 'color 0.3s ease',
                }}
              >
                DIAZ LAW OFFICE
              </div>
              <div
                className="font-mono-dm tracking-widest uppercase"
                style={{
                  fontSize: '0.55rem',
                  color: logoSubColor,
                  letterSpacing: '0.18em',
                  marginTop: '3px',
                  lineHeight: 1,
                }}
              >
                Lawyer / Notary Public
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link-lux ${pathname === href ? 'active' : ''}`}
                style={{ color: pathname === href ? 'var(--gold)' : 'var(--text-secondary)' }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">

            {/* Theme toggle with label */}
            {mounted && (
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={toggle}
                  aria-label="Toggle theme"
                  className="w-9 h-9 rounded-md flex items-center justify-center transition-all duration-200"
                  style={{
                    background: toggleBg,
                    border: `1px solid ${toggleBorder}`,
                    color: toggleColor,
                  }}
                >
                  {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </button>
                <span
                  className="font-mono-dm"
                  style={{
                    fontSize: '0.5rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: toggleColor,
                    lineHeight: 1,
                  }}
                >
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </div>
            )}

            {/* Book Now CTA */}
            <Link
              href="/appointment"
              className="hidden md:inline-flex btn-gold text-xs py-2.5 px-5"
            >
              Book Now
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(!open)}
              aria-label="Menu"
              className="md:hidden w-9 h-9 rounded-md flex items-center justify-center transition-all"
              style={{
                background: toggleBg,
                border: `1px solid ${toggleBorder}`,
                color: toggleColor,
              }}
            >
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t"
          style={{ background: navBg, borderColor: navBorder }}
        >
          <div className="container-site py-5 space-y-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block py-3 text-sm font-medium transition-colors"
                style={{
                  color: pathname === href ? 'var(--gold)' : 'var(--text-secondary)',
                  borderBottom: `1px solid ${navBorder}`,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4">
              <Link href="/appointment" className="btn-gold w-full justify-center text-xs py-3">
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
