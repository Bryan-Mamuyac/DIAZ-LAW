'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Sun, Moon, Menu, X } from 'lucide-react'
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
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const onHero = pathname === '/'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  // Transparent only on hero section before scroll
  const isTransparent = onHero && !scrolled
  const isDark = theme === 'dark'

  // Logo filter:
  // - On transparent hero (always dark bg): invert to white
  // - On light mode scrolled/non-hero: show original (logo has dark bg, looks good)
  // - On dark mode scrolled/non-hero: invert to white so it's visible
  const logoFilter = isTransparent
    ? 'brightness(0) invert(1)'
    : isDark
      ? 'brightness(0) invert(1)'
      : 'none'

  // Nav link color
  const navLinkColor = isTransparent
    ? 'rgba(237,232,222,0.8)'
    : 'var(--text-secondary)'

  // Theme toggle button style
  const toggleStyle = {
    background: isTransparent
      ? 'rgba(237,232,222,0.1)'
      : 'var(--bg-raised)',
    border: '1px solid',
    borderColor: isTransparent
      ? 'rgba(237,232,222,0.2)'
      : 'var(--border)',
    color: isTransparent
      ? 'rgba(237,232,222,0.8)'
      : 'var(--text-muted)',
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-scrolled' : 'nav-top'
      }`}
    >
      <div className="container-site">
        <div className="flex items-center justify-between h-[68px]">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img
              src="/images/DiazLogo.png"
              alt="Diaz Law Office"
              className="h-10 w-auto object-contain"
              style={{
                filter: logoFilter,
                transition: 'filter 0.3s ease',
              }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link-lux ${pathname === href ? 'active' : ''}`}
                style={{ color: pathname === href ? 'var(--gold)' : navLinkColor }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-3">

            {/* Theme toggle */}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-md flex items-center justify-center transition-all duration-200"
              style={toggleStyle}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

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
              style={toggleStyle}
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
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="container-site py-5 space-y-1">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block py-3 text-sm font-medium transition-colors"
                style={{
                  color: pathname === href ? 'var(--gold)' : 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4">
              <Link
                href="/appointment"
                className="btn-gold w-full justify-center text-xs py-3"
              >
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
