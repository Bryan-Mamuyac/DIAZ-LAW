import Link from 'next/link'
import { Scale, FileText, Users, Phone, ArrowRight, CheckCircle, Star, Clock, Shield } from 'lucide-react'
import { Footer } from '@/components/Footer'

const services = [
  {
    icon: FileText,
    title: 'Notarial Services',
    desc: 'Affidavits, SPAs, Deeds of Sale, Acknowledgments, Jurats, and all your notarization needs — handled with care and precision.',
  },
  {
    icon: Scale,
    title: 'Legal Representation',
    desc: 'Civil, family, and criminal law cases. From filing complaints to courtroom advocacy, we stand by your side.',
  },
  {
    icon: Users,
    title: 'Legal Consultation',
    desc: 'Not sure where to start? Get clear, honest legal advice tailored to your situation — no legal jargon, just answers.',
  },
  {
    icon: FileText,
    title: 'Contract Drafting & Review',
    desc: 'Business agreements, lease contracts, MOAs — drafted or reviewed to protect your interests.',
  },
]

const whyUs = [
  { icon: CheckCircle, text: 'Transparent and honest legal advice' },
  { icon: Clock, text: 'Prompt appointments and responsive communication' },
  { icon: Shield, text: 'Client confidentiality strictly observed' },
  { icon: Star, text: 'Personalized service — you are never just a case number' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero-mesh min-h-screen flex items-center pt-16 relative overflow-hidden">
        {/* Decorative gold line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }}
        />

        {/* Floating shapes */}
        <div
          className="absolute top-1/4 right-16 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: 'var(--gold)' }}
        />
        <div
          className="absolute bottom-1/4 left-8 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
          style={{ backgroundColor: '#3f84f8' }}
        />

        <div className="section-container py-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-yellow-300 uppercase">
                Private Practitioner · Est. July 2024
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Your Legal
              <span className="block" style={{ color: 'var(--gold)' }}>
                Rights Matter.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-blue-100/80 leading-relaxed mb-10 max-w-xl">
              Atty. Jushua Mari Lumague Diaz provides trusted legal and notarial services — helping individuals and businesses navigate the law with confidence.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/appointment" className="btn-primary flex items-center gap-2 text-base py-4 px-7">
                Book an Appointment
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 text-base py-4 px-7 rounded-xl font-semibold transition-all duration-200 border"
                style={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'rgba(255,255,255,0.9)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Phone size={16} />
                Contact Us
              </Link>
            </div>

            {/* Trust bar */}
            <div className="mt-12 flex flex-wrap gap-6">
              {whyUs.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-blue-200/70">
                  <Icon size={15} className="text-yellow-400 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24">
        <div className="section-container">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--navy-accent)' }}>
              What We Offer
            </p>
            <h2 className="section-title">Legal Services</h2>
            <p className="section-subtitle max-w-xl mx-auto">
              From notarization to full legal representation — we are here for the legal matters that matter most to you.
            </p>
            <div className="gold-divider max-w-xs mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="card p-6 group hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: 'rgba(14, 68, 184, 0.12)' }}
                >
                  <Icon size={22} style={{ color: 'var(--navy-accent)' }} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="section-container">
          <div
            className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0c1f54 0%, #0e44b8 100%)',
            }}
          >
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
              style={{ backgroundColor: 'var(--gold)', transform: 'translate(30%, -30%)' }}
            />
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Need Legal Help Today?
            </h2>
            <p className="text-blue-200 text-lg mb-8 max-w-lg mx-auto">
              Book an appointment online — quick, easy, and no login required.
            </p>
            <Link
              href="/appointment"
              className="inline-flex items-center gap-2 font-bold py-4 px-8 rounded-xl text-navy-950 transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: 'var(--gold)' }}
            >
              Schedule Now <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
