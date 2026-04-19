export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { Scale, GraduationCap, Briefcase, ArrowRight, Mail, Phone, CheckCircle } from 'lucide-react'

const AREAS = [
  'Notarial Services (All types)',
  'Civil & Family Law',
  'Property & Real Estate Law',
  'Criminal Law Consultation',
  'Business & Corporate Law',
  'Contract Drafting & Review',
  'Legal Consultation (General)',
  'Annulment & Nullity of Marriage',
]

const VALUES = [
  'Integrity in every legal matter — without exception',
  'Honest counsel, even when it is not what you want to hear',
  'Absolute client confidentiality, always',
  'Accessible and affordable legal services',
  'Clear communication in plain Filipino or English',
]

export default function AboutPage() {
  return (
    <>
      <div className="pt-[68px]" style={{ background: 'var(--bg-canvas)' }}>

        {/* Dark header */}
        <div className="relative overflow-hidden py-20" style={{ background: '#07090F' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-0 inset-x-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--gold) 40%, transparent)',
                opacity: 0.4,
              }}
            />
            <div
              className="absolute right-[-8%] top-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
              style={{ border: '1px solid rgba(201,168,76,0.07)' }}
            />
            <div
              className="absolute right-[8%] top-1/2 -translate-y-1/2 w-52 h-52 rounded-full"
              style={{ border: '1px solid rgba(201,168,76,0.05)' }}
            />
          </div>
          <div className="container-site relative">
            <p className="eyebrow mb-6" style={{ color: 'rgba(201,168,76,0.75)' }}>
              The Attorney
            </p>
            <h1
              className="font-display font-light leading-tight mb-4"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', color: '#EDE8DE' }}
            >
              Atty. Jushua Mari<br />
              <em>Lumague Diaz</em>
            </h1>
            <p
              className="font-mono-dm tracking-wide"
              style={{ fontSize: '0.75rem', color: 'rgba(176,168,156,0.6)' }}
            >
              Lawyer &amp; Notary Public · Private Practitioner · DIAZ LAW
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="container-site py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-5">

              {/* Photo card */}
              <div className="card-luxury overflow-hidden">
                <div className="relative">
                  <img
                    src="/images/MrDiazPlaceHolder.png"
                    alt="Atty. Jushua Mari Lumague Diaz"
                    className="w-full object-cover"
                    style={{ maxHeight: '280px', objectPosition: 'top center' }}
                  />
                  <div
                    className="absolute bottom-0 inset-x-0 h-16"
                    style={{ background: 'linear-gradient(to top, var(--bg-surface), transparent)' }}
                  />
                </div>
                <div className="p-6">
                  <p
                    className="font-display font-medium"
                    style={{ fontSize: '1.125rem', color: 'var(--text-primary)' }}
                  >
                    Atty. Jushua Mari L. Diaz
                  </p>
                  <p
                    className="font-mono-dm text-xs tracking-widest uppercase mt-1 mb-4"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Lawyer &amp; Notary Public
                  </p>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md"
                    style={{
                      background: 'rgba(34,197,94,0.09)',
                      border: '1px solid rgba(34,197,94,0.22)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>
                      Accepting Clients
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick contact */}
              <div className="card-luxury p-6 space-y-3">
                <p
                  className="font-mono-dm text-xs tracking-widest uppercase mb-4"
                  style={{ color: 'var(--gold)' }}
                >
                  Contact
                </p>
                <a
                  href="tel:09952638355"
                  className="footer-link flex items-center gap-3"
                >
                  <Phone size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  0995 263 8355
                </a>
                <a
                  href="mailto:jushuamari@gmail.com"
                  className="footer-link flex items-center gap-3"
                >
                  <Mail size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  jushuamari@gmail.com
                </a>
              </div>

              {/* Education */}
              <div className="card-luxury p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap size={15} style={{ color: 'var(--gold)' }} />
                  <p
                    className="font-mono-dm text-xs tracking-widest uppercase"
                    style={{ color: 'var(--gold)' }}
                  >
                    Education
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-raised)' }}>
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    Saint Louis University
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Juris Doctor (J.D.) · School of Law
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                    Baguio City, Philippines
                  </p>
                </div>
              </div>

              {/* Practice */}
              <div className="card-luxury p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={14} style={{ color: 'var(--gold)' }} />
                  <p
                    className="font-mono-dm text-xs tracking-widest uppercase"
                    style={{ color: 'var(--gold)' }}
                  >
                    Private Practice
                  </p>
                </div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                  DIAZ LAW
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  July 23, 2024 – Present
                </p>
              </div>
            </div>

            {/* Main */}
            <div className="lg:col-span-8 space-y-7">

              {/* Bio */}
              <div className="card-luxury p-8">
                <p className="eyebrow mb-6">Profile</p>
                <div
                  className="space-y-4 text-base leading-relaxed"
                  style={{ color: 'var(--text-muted)', fontWeight: 300 }}
                >
                  <p>
                    Atty. Jushua Mari Lumague Diaz is a licensed Filipino lawyer and notary public
                    practicing under{' '}
                    <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                      DIAZ LAW
                    </strong>
                    . He is committed to delivering accessible, principled, and effective legal
                    services to individuals, families, and small businesses.
                  </p>
                  <p>
                    Whether you need a document notarized, a contract reviewed, or legal
                    representation in a dispute — Atty. Diaz approaches every matter with undivided
                    dedication and professional integrity.
                  </p>
                  <p>
                    His practice places a premium on clear communication: clients always understand
                    their legal situation and options — in plain terms, never in legalese.
                  </p>
                </div>
              </div>

              {/* Areas */}
              <div className="card-luxury p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Scale size={17} style={{ color: 'var(--gold)' }} />
                  <p className="eyebrow">Areas of Practice</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AREAS.map(area => (
                    <div
                      key={area}
                      className="flex items-start gap-3 text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <CheckCircle
                        size={13}
                        style={{ color: 'var(--gold)', flexShrink: 0, marginTop: '3px' }}
                      />
                      {area}
                    </div>
                  ))}
                </div>
              </div>

              {/* Values */}
              <div className="card-luxury p-8">
                <p className="eyebrow mb-6">Core Values</p>
                <ul className="space-y-4">
                  {VALUES.map((v, i) => (
                    <li key={v} className="flex items-start gap-4">
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-mono-dm font-bold mt-0.5"
                        style={{
                          background: 'var(--gold-pale)',
                          border: '1px solid var(--gold-border)',
                          color: 'var(--gold)',
                          fontSize: '0.625rem',
                        }}
                      >
                        {i + 1}
                      </span>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-muted)', fontWeight: 300 }}
                      >
                        {v}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link href="/appointment" className="btn-gold">
                  Book an Appointment <ArrowRight size={15} />
                </Link>
                <Link href="/contact" className="btn-outline">
                  <Mail size={14} /> Send a Message
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
