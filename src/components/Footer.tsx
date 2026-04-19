import Link from 'next/link'
import { Phone, Mail, Facebook } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--bg-inset)', borderTop: '1px solid var(--border)' }}>
      <div className="container-site py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand */}
          <div className="md:col-span-5">
            <img
              src="/images/DiazLogo.png"
              alt="Diaz Law Office"
              className="h-11 w-auto object-contain mb-5"
            />
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
              Trusted legal counsel and notarial services for individuals and businesses.
              Your rights. Our commitment.
            </p>
            <div className="rule-gold max-w-[100px] mt-6" />
            <div className="flex items-center gap-3 mt-5">
              {[
                { href: 'tel:09952638355',                              Icon: Phone   },
                { href: 'mailto:jushuamari@gmail.com',                  Icon: Mail    },
                { href: 'https://www.facebook.com/jushuamari.diaz',     Icon: Facebook },
              ].map(({ href, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-md flex items-center justify-center transition-all duration-200 group"
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.borderColor = 'var(--gold)'
                    el.style.color       = 'var(--gold)'
                    el.style.background  = 'var(--gold-pale)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.borderColor = 'var(--border-strong)'
                    el.style.color       = 'var(--text-muted)'
                    el.style.background  = 'transparent'
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div className="md:col-span-3 md:col-start-7">
            <p className="font-mono-dm text-xs tracking-widest uppercase mb-5" style={{ color: 'var(--gold)' }}>
              Navigation
            </p>
            <ul className="space-y-3">
              {[
                ['/', 'Home'],
                ['/appointment', 'Book Appointment'],
                ['/contact', 'Contact'],
                ['/about', 'About Atty. Diaz'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--gold)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <p className="font-mono-dm text-xs tracking-widest uppercase mb-5" style={{ color: 'var(--gold)' }}>
              Contact
            </p>
            <ul className="space-y-3">
              {[
                { href: 'tel:09952638355',                           Icon: Phone,    label: '0995 263 8355' },
                { href: 'mailto:jushuamari@gmail.com',               Icon: Mail,     label: 'jushuamari@gmail.com' },
                { href: 'https://www.facebook.com/jushuamari.diaz',  Icon: Facebook, label: 'Facebook — Private Concerns' },
              ].map(({ href, Icon, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="text-sm flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                  >
                    <Icon size={13} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rule-gold mt-12" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-6">
          <p className="font-mono-dm text-xs" style={{ color: 'var(--text-faint)' }}>
            © {year} DIAZ LAW OFFICE. All rights reserved.
          </p>
          <p className="font-mono-dm text-xs" style={{ color: 'var(--text-faint)' }}>
            Atty. Jushua Mari Lumague Diaz · Private Practitioner
          </p>
        </div>
      </div>
    </footer>
  )
}
