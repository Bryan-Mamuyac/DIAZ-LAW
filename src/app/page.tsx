export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { ArrowRight, Scale, FileText, Users, Briefcase, Phone, CheckCircle, MapPin as MapPinIcon, Clock as ClockIcon, Phone as PhoneIcon } from 'lucide-react'
import { Footer } from '@/components/Footer'

const SERVICES = [
  {
    icon: FileText,
    title: 'Notarial Services',
    desc: 'Affidavits, Special Power of Attorney, Deeds of Sale, Acknowledgments, Jurats — all handled with precision and care.',
    items: ['Affidavit of Loss / Support', 'SPA & GPA', 'Deed of Sale / Donation'],
  },
  {
    icon: Scale,
    title: 'Legal Representation',
    desc: 'Civil, family, and criminal law advocacy. From complaint filing to courtroom representation, we stand by your side.',
    items: ['Family & Civil Law', 'Criminal Defense', 'Property Disputes'],
  },
  {
    icon: Briefcase,
    title: 'Business & Contracts',
    desc: 'Contract drafting, review, and business law counsel to protect your enterprise and prevent costly legal issues.',
    items: ['Contract Drafting', 'Business Registration', 'MOA & Partnership'],
  },
  {
    icon: Users,
    title: 'Legal Consultation',
    desc: 'Not sure where to start? Get honest, direct legal advice in plain language — no jargon, no runaround.',
    items: ['One-on-one Consultation', 'Case Assessment', 'Legal Strategy'],
  },
]

const STATS = [
  { value: 'Est. 2024', label: 'Private Practice' },
  { value: '30+', label: 'Service Types' },
  { value: '100%', label: 'Client Confidential' },
  { value: 'SLU', label: 'Juris Doctor' },
]

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-section">
        {/* Decorative background shapes */}
        <div className="hero-deco-circle hero-deco-circle-1" />
        <div className="hero-deco-circle hero-deco-circle-2" />

        <div className="hero-container relative z-10">
          {/* Glass card wrapper */}
          <div className="hero-glass-card">
            {/* Eyebrow */}
            <div className="eyebrow mb-8 anim-fade-in">
              Private Practitioner · Est. July 2024
            </div>

            {/* Headline */}
            <h1 className="font-display font-light leading-[1.08] mb-7 anim-fade-up d-1 hero-headline">
              Trusted Legal
              <span className="block italic">
                <span className="gold-shimmer">Counsel &amp; Care.</span>
              </span>
            </h1>

            {/* Sub */}
            <p className="text-lg leading-relaxed mb-10 max-w-xl anim-fade-up d-2 hero-sub">
              Atty. Jushua Mari Lumague Diaz delivers rigorous legal and notarial services —
              helping individuals and businesses navigate the law with clarity and confidence.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-14 anim-fade-up d-3">
              <Link href="/appointment" className="btn-gold">
                Book an Appointment <ArrowRight size={15} />
              </Link>
              <Link href="/contact" className="btn-outline">
                <Phone size={14} /> Contact Us
              </Link>
            </div>

            {/* Trust points */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 anim-fade-up d-4">
              {[
                'Honest, transparent advice',
                'Strict client confidentiality',
                'Same-day response, Mon – Fri',
                'Personalized — not just a number',
              ].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm hero-trust-item">
                  <CheckCircle size={13} style={{ color: 'var(--gold)', opacity: 0.8, flexShrink: 0 }} />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: 'var(--bg-inset)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container-site py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p
                  className="font-display font-medium mb-1"
                  style={{ fontSize: '2rem', color: 'var(--gold)', letterSpacing: '-0.01em' }}
                >
                  {value}
                </p>
                <p className="font-mono-dm text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="section-pad">
        <div className="container-site">
          <div className="mb-14">
            <p className="eyebrow mb-5">What We Offer</p>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <h2
                className="font-display font-light leading-tight"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)', color: 'var(--text-primary)', maxWidth: '480px' }}
              >
                Comprehensive <em>Legal Services</em>
              </h2>
              <Link href="/appointment" className="btn-outline flex-shrink-0 self-start sm:self-auto">
                Get Started <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map(({ icon: Icon, title, desc, items }) => (
              <div key={title} className="card-luxury p-7 group">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-5 transition-all duration-300"
                  style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)' }}
                >
                  <Icon size={20} style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="font-display font-medium mb-3" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>
                  {desc}
                </p>
                <ul className="space-y-1.5">
                  {items.map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--gold)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARK CTA BANNER ── */}
      <section className="section-pad-sm">
        <div className="container-site">
          <div
            className="cta-banner rounded-2xl relative overflow-hidden p-12 sm:p-16"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 inset-x-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--gold) 40%, transparent)', opacity: 0.4 }} />
              <div className="absolute bottom-0 inset-x-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, var(--gold) 40%, transparent)', opacity: 0.2 }} />
              <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />
            </div>

            <div className="relative max-w-2xl">
              <p className="eyebrow mb-6" style={{ color: 'var(--gold)' }}>
                Ready to proceed?
              </p>
              <h2
                className="font-display font-light mb-5 leading-tight"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--text-primary)' }}
              >
                Schedule Your <em>Consultation</em> Today
              </h2>
              <p className="text-base mb-8" style={{ color: 'var(--text-muted)', fontWeight: 300, maxWidth: '460px' }}>
                Book online in minutes — no account required. Atty. Diaz will confirm your appointment personally.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/appointment" className="btn-gold">
                  Book an Appointment <ArrowRight size={15} />
                </Link>
                <a href="tel:09953622071"
                  className="btn-outline"
                  style={{ borderColor: 'var(--border-strong)', color: 'var(--text-primary)' }}
                >
                  <Phone size={14} /> Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOCATION SECTION ── */}
      <section className="section-pad-sm">
        <div className="container-site">
          <div className="mb-10">
            <p className="eyebrow mb-5">Find Us</p>
            <h2
              className="font-display font-light leading-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--text-primary)' }}
            >
              Office <em>Location</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Map embed */}
            <div className="lg:col-span-3 rounded-2xl overflow-hidden card-luxury" style={{ minHeight: '360px' }}>
              <iframe
                title="Diaz Law Office Location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=120.35372%2C16.39057%2C120.35972%2C16.39457&layer=mapnik&marker=16.39257%2C120.35672"
                width="100%"
                height="100%"
                style={{ border: 'none', minHeight: '360px', display: 'block' }}
                loading="lazy"
              />
            </div>

            {/* Office info */}
            <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
              <div className="card-luxury p-7 space-y-5">
                <p className="font-mono-dm text-xs tracking-widest uppercase" style={{ color: 'var(--gold)' }}>
                  Office Details
                </p>

                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)' }}>
                    <MapPinIcon size={15} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-0.5 font-mono-dm tracking-wider uppercase"
                      style={{ color: 'var(--text-muted)' }}>Address</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      2nd Floor, 7-Eleven Building<br />
                      Aringay, 2503 La Union<br />
                      Philippines
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)' }}>
                    <ClockIcon size={15} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1 font-mono-dm tracking-wider uppercase"
                      style={{ color: 'var(--text-muted)' }}>Office Hours</p>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-sm gap-8">
                        <span style={{ color: 'var(--text-secondary)' }}>Monday – Friday</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>8:00 AM – 5:00 PM</span>
                      </div>
                      <div className="flex items-center justify-between text-sm gap-8">
                        <span style={{ color: 'var(--text-secondary)' }}>Saturday – Sunday</span>
                        <span className="text-red-500 font-medium text-xs">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)' }}>
                    <PhoneIcon size={15} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-0.5 font-mono-dm tracking-wider uppercase"
                      style={{ color: 'var(--text-muted)' }}>Phone</p>
                    <a href="tel:09953622071" className="text-sm font-medium footer-link"
                      style={{ color: 'var(--text-primary)' }}>
                      0995 362 2071
                    </a>
                  </div>
                </div>

                <a
                  href="https://www.google.com/maps/place/Diaz+Law+Office/@16.3936726,120.3567218,20.19z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full justify-center text-xs py-3 mt-2"
                >
                  Open in Google Maps ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
