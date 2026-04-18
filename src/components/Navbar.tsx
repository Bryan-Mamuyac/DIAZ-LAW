'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Sun, Moon, Menu, X, Scale } from 'lucide-react'
import { useTheme } from './ThemeProvider'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/appointment', label: 'Appointment' },
  { href: '/contact', label: 'Contact' },
  { href: '/about', label: 'About' },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [pathname])

  return (
    <header
      style={{
        backgroundColor: scrolled ? 'var(--bg-card)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--navy-accent)' }}
            >
              <Scale size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-display font-bold text-base block" style={{ color: 'var(--text-primary)' }}>
                DIAZ LAW
              </span>
              <span className="text-xs block" style={{ color: 'var(--text-muted)' }}>
                Lawyer & Notary Public
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${pathname === href ? 'active' : ''}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <Link
              href="/appointment"
              className="hidden md:block btn-primary text-sm py-2 px-4"
            >
              Book Now
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="section-container py-4 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link block py-3 text-base ${pathname === href ? 'active' : ''}`}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
              <Link href="/appointment" className="btn-primary block text-center text-sm py-3">
                Book an Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
