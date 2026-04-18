import Link from 'next/link'
import { Scale, Facebook, Phone, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer
      className="mt-24 border-t"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--navy-accent)' }}>
                <Scale size={18} className="text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-base block" style={{ color: 'var(--text-primary)' }}>DIAZ LAW</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Lawyer & Notary Public</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Providing trusted legal counsel and notarial services. Your rights. Our priority.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/appointment', label: 'Book an Appointment' },
                { href: '/contact', label: 'Contact Us' },
                { href: '/about', label: 'About Atty. Diaz' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm transition-colors hover:underline" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Get in Touch</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Phone size={15} style={{ color: 'var(--navy-accent)' }} />
                <a href="tel:09952638355" className="hover:underline">0995 263 8355</a>
              </li>
              <li className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Mail size={15} style={{ color: 'var(--navy-accent)' }} />
                <a href="mailto:jushuamari@gmail.com" className="hover:underline">jushuamari@gmail.com</a>
              </li>
              <li className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Facebook size={15} style={{ color: 'var(--navy-accent)' }} />
                <a href="https://www.facebook.com/jushuamari.diaz" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Facebook — Private Concerns
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="gold-divider" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>© {new Date().getFullYear()} DIAZ LAW. All rights reserved.</span>
          <span>Atty. Jushua Mari Lumague Diaz · Private Practitioner</span>
        </div>
      </div>
    </footer>
  )
}
