import Link from 'next/link'
import { Phone, Mail, Facebook, MapPin, Clock } from 'lucide-react'

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
              <a href="tel:09953622071" className="footer-icon-btn">
                <Phone size={14} />
              </a>
              <a href="mailto:jushuamari@gmail.com" className="footer-icon-btn">
                <Mail size={14} />
              </a>
              <a
                href="https://www.facebook.com/jushuamari.diaz"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-icon-btn"
              >
                <Facebook size={14} />
              </a>
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
                  <Link href={href} className="footer-link">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="md:col-span-3">
            <p className="font-mono-dm text-xs tracking-widest uppercase mb-5" style={{ color: 'var(--gold)' }}>
              Contact & Hours
            </p>
            <ul className="space-y-3">
              <li>
                <a href="tel:09953622071" className="footer-link flex items-start gap-2">
                  <Phone size={13} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                  0995 362 2071
                </a>
              </li>
              <li>
                <a href="mailto:jushuamari@gmail.com" className="footer-link flex items-start gap-2">
                  <Mail size={13} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                  jushuamari@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/jushuamari.diaz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link flex items-start gap-2"
                >
                  <Facebook size={13} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                  Facebook — Private Concerns
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Clock size={13} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                <span>Mon – Fri &nbsp;·&nbsp; 8:00 AM – 5:00 PM</span>
              </li>
              <li className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={13} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                <span>2nd Floor, 7-Eleven Building,<br />Aringay, 2503 La Union</span>
              </li>
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
