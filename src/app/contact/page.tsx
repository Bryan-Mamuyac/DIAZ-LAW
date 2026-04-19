'use client'

export const dynamic = 'force-dynamic'


import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Footer } from '@/components/Footer'
import { Phone, Mail, Facebook, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type FormData = { name: string; email: string; subject: string; message: string }
const INIT: FormData = { name: '', email: '', subject: '', message: '' }

const CHANNELS = [
  {
    icon: Phone,
    label: 'Phone / Viber',
    value: '0995 362 2071',
    sub: 'Mon – Fri · 8:00 AM – 5:00 PM',
    href: 'tel:09953622071',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'jushuamari@gmail.com',
    sub: 'Usually replies within 24 hours',
    href: 'mailto:jushuamari@gmail.com',
  },
  {
    icon: Facebook,
    label: 'Facebook',
    value: 'Jushua Mari Lumague Diaz',
    sub: 'For sensitive / private concerns',
    href: 'https://www.facebook.com/jushuamari.diaz',
  },
]

export default function ContactPage() {
  const [form,    setForm]    = useState<FormData>(INIT)
  const [errors,  setErrors]  = useState<Partial<FormData>>({})
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const validate = () => {
    const e: Partial<FormData> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (!form.subject.trim()) e.subject = 'Required'
    if (!form.message.trim()) e.message = 'Required'
    return e
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name as keyof FormData]) setErrors(p => ({ ...p, [name]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('contact_messages').insert([{
        name: form.name.trim(), email: form.email.trim(),
        subject: form.subject.trim(), message: form.message.trim(), read: false,
      }])
      if (error) throw error
      setSent(true); setForm(INIT)
      toast.success('Message sent!')
    } catch {
      toast.error('Failed to send. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="pt-[68px]" style={{ background: 'var(--bg-canvas)' }}>
        {/* Page header */}
        <div className="py-16 border-b" style={{ background: 'var(--bg-inset)', borderColor: 'var(--border)' }}>
          <div className="container-site">
            <p className="eyebrow mb-5">Get in Touch</p>
            <h1 className="font-display font-light leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', color: 'var(--text-primary)' }}>
              Contact <em>Atty. Diaz</em>
            </h1>
            <p className="mt-4 text-base max-w-lg" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
              Reach out through any of the channels below, or send a message directly.
            </p>
          </div>
        </div>

        <div className="container-site py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

            {/* Left — contact channels */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-display font-medium mb-6"
                style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                Direct Channels
              </h2>

              {CHANNELS.map(({ icon: Icon, label, value, sub, href }) => (
                <a key={label} href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="card-luxury flex items-start gap-4 p-5 group"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)' }}>
                    <Icon size={17} style={{ color: 'var(--gold)' }} />
                  </div>
                  <div>
                    <p className="font-mono-dm text-xs tracking-widest uppercase mb-0.5"
                      style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{sub}</p>
                  </div>
                </a>
              ))}

              {/* Direct email callout */}
              <div className="mt-6 p-4 rounded-lg"
                style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Or email directly:{' '}
                  <a href="mailto:jushuamari@gmail.com" className="font-semibold"
                    style={{ color: 'var(--gold)' }}>
                    jushuamari@gmail.com
                  </a>
                </p>
              </div>
            </div>

            {/* Right — message form */}
            <div className="lg:col-span-3">
              {sent ? (
                <div className="card-luxury p-10 text-center h-full flex flex-col items-center justify-center min-h-[360px]">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <CheckCircle2 size={28} className="text-green-500" />
                  </div>
                  <h3 className="font-display font-medium mb-3"
                    style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    Message Sent
                  </h3>
                  <div className="rule-gold max-w-[60px] mx-auto mb-4" />
                  <p className="text-sm mb-7" style={{ color: 'var(--text-muted)', maxWidth: '280px' }}>
                    Thank you. Atty. Diaz will respond to your message as soon as possible.
                  </p>
                  <button onClick={() => setSent(false)} className="btn-outline">
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card-luxury p-8 sm:p-10 space-y-6">
                  <h2 className="font-display font-medium"
                    style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    Send a Message
                  </h2>
                  <div className="rule-gold" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label-lux">Your Name <span className="text-red-500">*</span></label>
                      <input type="text" name="name" value={form.name}
                        onChange={handleChange} placeholder="Full name" className="input-luxury" />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="label-lux">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" name="email" value={form.email}
                        onChange={handleChange} placeholder="you@example.com" className="input-luxury" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="label-lux">Subject <span className="text-red-500">*</span></label>
                    <input type="text" name="subject" value={form.subject}
                      onChange={handleChange} placeholder="e.g. Question about notarization"
                      className="input-luxury" />
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <label className="label-lux">Message <span className="text-red-500">*</span></label>
                    <textarea name="message" value={form.message}
                      onChange={handleChange} rows={5}
                      placeholder="Write your message here..."
                      className="input-luxury resize-none" />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn-gold w-full justify-center py-4 disabled:opacity-60">
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
                      : <><Send size={14} /> Send Message</>
                    }
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
