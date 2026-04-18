'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Footer } from '@/components/Footer'
import { Phone, Mail, Facebook, MessageCircle, Send, Loader2, CheckCircle2, AlertCircle, User } from 'lucide-react'
import toast from 'react-hot-toast'

type FormData = {
  name: string
  email: string
  subject: string
  message: string
}

const initial: FormData = { name: '', email: '', subject: '', message: '' }

const contactCards = [
  {
    icon: Phone,
    label: 'Phone / Viber / WhatsApp',
    value: '0995 263 8355',
    href: 'tel:09952638355',
    hint: 'Available Mon–Sat, 8AM–6PM',
  },
  {
    icon: Mail,
    label: 'Email Address',
    value: 'jushuamari@gmail.com',
    href: 'mailto:jushuamari@gmail.com',
    hint: 'Usually replies within 24 hours',
  },
  {
    icon: Facebook,
    label: 'Facebook (Private Concerns)',
    value: 'Jushua Mari Lumague Diaz',
    href: 'https://www.facebook.com/jushuamari.diaz',
    hint: 'For sensitive matters — message directly',
  },
]

export default function ContactPage() {
  const [form, setForm] = useState<FormData>(initial)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const validate = () => {
    const e: Partial<FormData> = {}
    if (!form.name.trim()) e.name = 'Your name is required.'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'A valid email address is required.'
    if (!form.subject.trim()) e.subject = 'Subject is required.'
    if (!form.message.trim()) e.message = 'Message cannot be empty.'
    return e
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      const { error } = await supabase.from('contact_messages').insert([{
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        read: false,
      }])
      if (error) throw error
      setSent(true)
      setForm(initial)
      toast.success('Message sent successfully!')
    } catch {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="pt-28 pb-16">
        <div className="section-container">
          {/* Header */}
          <div className="text-center mb-14">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: 'rgba(14, 68, 184, 0.1)' }}
            >
              <MessageCircle size={30} style={{ color: 'var(--navy-accent)' }} />
            </div>
            <h1 className="section-title mb-3">Contact Us</h1>
            <p className="section-subtitle max-w-lg mx-auto">
              Have a question? Reach out directly or send a message below.
            </p>
            <div className="gold-divider max-w-xs mx-auto" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
            {/* Contact info */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-display text-xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
                Get in Touch
              </h2>
              {contactCards.map(({ icon: Icon, label, value, href, hint }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="card p-5 flex items-start gap-4 group hover:shadow-lg transition-all duration-200 block"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                    style={{ backgroundColor: 'rgba(14,68,184,0.1)' }}
                  >
                    <Icon size={20} style={{ color: 'var(--navy-accent)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </p>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {value}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {hint}
                    </p>
                  </div>
                </a>
              ))}

              {/* Direct email note */}
              <div
                className="p-4 rounded-xl text-sm"
                style={{ backgroundColor: 'rgba(14,68,184,0.06)', border: '1px solid rgba(14,68,184,0.15)' }}
              >
                <p style={{ color: 'var(--text-secondary)' }}>
                  Or email directly:{' '}
                  <a
                    href="mailto:jushuamari@gmail.com"
                    className="font-semibold underline"
                    style={{ color: 'var(--navy-accent)' }}
                  >
                    jushuamari@gmail.com
                  </a>
                </p>
              </div>
            </div>

            {/* Message form */}
            <div className="lg:col-span-3">
              {sent ? (
                <div className="card p-10 text-center h-full flex flex-col items-center justify-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}
                  >
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Message Sent!
                  </h3>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                    Thank you for reaching out. Atty. Diaz will get back to you as soon as possible.
                  </p>
                  <button onClick={() => setSent(false)} className="btn-primary px-6">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card p-8 space-y-5">
                  <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Send a Message
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label flex items-center gap-1.5">
                        <User size={12} /> Your Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Full name"
                        className="input-field"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label flex items-center gap-1.5">
                        <Mail size={12} /> Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="input-field"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={11} /> {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="label">Subject <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="e.g. Question about notarization"
                      className="input-field"
                    />
                    {errors.subject && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="label">Message <span className="text-red-500">*</span></label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Write your message here..."
                      className="input-field resize-none"
                    />
                    {errors.message && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4 disabled:opacity-60"
                  >
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> Sending...</>
                    ) : (
                      <><Send size={16} /> Send Message</>
                    )}
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
