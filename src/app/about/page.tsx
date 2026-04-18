import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { Scale, GraduationCap, Briefcase, ArrowRight, CheckCircle, Facebook, Phone, Mail } from 'lucide-react'

const values = [
  'Integrity in every legal interaction',
  'Honest advice — even when it is not what you want to hear',
  'Respect for client confidentiality at all times',
  'Affordable and accessible legal services',
  'Clear communication in plain Filipino / English',
]

const areas = [
  'Notarial Services (All types)',
  'Civil & Family Law',
  'Property and Real Estate Law',
  'Criminal Law',
  'Business & Corporate Law',
  'Contract Drafting & Review',
  'Legal Consultation',
]

export default function AboutPage() {
  return (
    <>
      <div className="pt-28 pb-16">
        {/* Hero */}
        <div
          className="relative overflow-hidden py-20 mb-16"
          style={{
            background: 'linear-gradient(135deg, #060e2e 0%, #0e44b8 100%)',
          }}
        >
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ backgroundColor: '#f5c842', transform: 'translate(30%, -30%)' }}
          />
          <div className="section-container relative">
            <div className="max-w-2xl">
              <div
                className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10"
              >
                <Scale size={14} className="text-yellow-400" />
                <span className="text-xs font-semibold tracking-widest text-yellow-300 uppercase">
                  About the Attorney
                </span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
                Atty. Jushua Mari<br />Lumague Diaz
              </h1>
              <p className="text-blue-200 text-lg leading-relaxed">
                Lawyer and Notary Public · Private Practitioner · DIAZ LAW
              </p>
            </div>
          </div>
        </div>

        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Sidebar */}
            <div className="space-y-5">
              {/* Profile card */}
              <div className="card p-6 text-center">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0e44b8, #3f84f8)' }}
                >
                  <Scale size={36} className="text-white" />
                </div>
                <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  Atty. Jushua Mari L. Diaz
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Lawyer & Notary Public
                </p>
                <div
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Accepting Clients
                </div>
              </div>

              {/* Contact quick */}
              <div className="card p-5 space-y-3">
                <h4 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Contact</h4>
                <a href="tel:09952638355" className="flex items-center gap-3 text-sm group" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={15} style={{ color: 'var(--navy-accent)' }} />
                  <span className="group-hover:underline">0995 263 8355</span>
                </a>
                <a href="mailto:jushuamari@gmail.com" className="flex items-center gap-3 text-sm group" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={15} style={{ color: 'var(--navy-accent)' }} />
                  <span className="group-hover:underline">jushuamari@gmail.com</span>
                </a>
                <a href="https://www.facebook.com/jushuamari.diaz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm group" style={{ color: 'var(--text-muted)' }}>
                  <Facebook size={15} style={{ color: 'var(--navy-accent)' }} />
                  <span className="group-hover:underline">Facebook Profile</span>
                </a>
              </div>

              {/* Practice since */}
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase size={16} style={{ color: 'var(--navy-accent)' }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Private Practice</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  DIAZ LAW · July 23, 2024 – Present
                </p>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio */}
              <div className="card p-8">
                <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  About Atty. Diaz
                </h2>
                <div className="space-y-4 text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  <p>
                    Atty. Jushua Mari Lumague Diaz is a licensed Filipino lawyer and notary public based in private practice under <strong style={{ color: 'var(--text-secondary)' }}>DIAZ LAW</strong>. He is committed to delivering accessible, honest, and effective legal services to individuals, families, and small businesses.
                  </p>
                  <p>
                    Whether you need a document notarized, a contract reviewed, or representation in a legal dispute — Atty. Diaz approaches every case with the same level of dedication and professionalism.
                  </p>
                  <p>
                    His practice emphasizes clear communication, so clients always understand their legal situation and options — in plain terms, not just legal jargon.
                  </p>
                </div>
              </div>

              {/* Education */}
              <div className="card p-8">
                <div className="flex items-center gap-2 mb-5">
                  <GraduationCap size={22} style={{ color: 'var(--navy-accent)' }} />
                  <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Education
                  </h2>
                </div>
                <div
                  className="flex items-start gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: 'rgba(14,68,184,0.06)', border: '1px solid rgba(14,68,184,0.15)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'rgba(14,68,184,0.15)' }}
                  >
                    <GraduationCap size={18} style={{ color: 'var(--navy-accent)' }} />
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Saint Louis University</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Juris Doctor (J.D.) — School of Law</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Baguio City, Benguet, Philippines</p>
                  </div>
                </div>
              </div>

              {/* Areas of Practice */}
              <div className="card p-8">
                <div className="flex items-center gap-2 mb-5">
                  <Scale size={22} style={{ color: 'var(--navy-accent)' }} />
                  <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Areas of Practice
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {areas.map(area => (
                    <div key={area} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle size={15} style={{ color: 'var(--navy-accent)' }} className="flex-shrink-0" />
                      {area}
                    </div>
                  ))}
                </div>
              </div>

              {/* Values */}
              <div className="card p-8">
                <h2 className="font-display text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
                  Core Values
                </h2>
                <ul className="space-y-3">
                  {values.map(v => (
                    <li key={v} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: 'var(--gold)', opacity: 0.9 }}
                      >
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      {v}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-4">
                <Link href="/appointment" className="btn-primary flex items-center gap-2">
                  Book an Appointment <ArrowRight size={16} />
                </Link>
                <Link href="/contact" className="btn-primary flex items-center gap-2" style={{ backgroundColor: 'transparent', border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <Mail size={16} /> Send a Message
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
