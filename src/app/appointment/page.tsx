'use client'

export const dynamic = 'force-dynamic'


import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ISSUE_TYPES } from '@/lib/constants'
import { Footer } from '@/components/Footer'
import { CalendarCheck, ChevronDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

type FormData = {
  first_name: string; last_name: string
  address: string; age: string
  issue_type: string; description: string
}
const INIT: FormData = { first_name:'', last_name:'', address:'', age:'', issue_type:'', description:'' }
const GROUPS = Array.from(new Set(ISSUE_TYPES.map(i => i.group)))

export default function AppointmentPage() {
  const [form,    setForm]    = useState<FormData>(INIT)
  const [errors,  setErrors]  = useState<Partial<FormData>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const e: Partial<FormData> = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim())  e.last_name  = 'Required'
    if (!form.address.trim())    e.address    = 'Required'
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120)
      e.age = 'Enter a valid age'
    if (!form.issue_type) e.issue_type = 'Please select a type'
    return e
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name as keyof FormData]) setErrors(p => ({ ...p, [name]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fill in all required fields.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('appointments').insert([{
        first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        address: form.address.trim(), age: Number(form.age),
        issue_type: form.issue_type, description: form.description.trim() || null,
        status: 'pending',
      }])
      if (error) throw error
      setSuccess(true); setForm(INIT)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <>
      <div className="min-h-screen flex items-center justify-center px-5 pt-[68px]"
        style={{ background: 'var(--bg-canvas)' }}>
        <div className="card-luxury p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle2 size={30} className="text-green-500" />
          </div>
          <h2 className="font-display font-medium mb-3" style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>
            Appointment Submitted
          </h2>
          <div className="rule-gold max-w-[80px] mx-auto mb-5" />
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            Your request has been received. Atty. Diaz or the secretary will reach out
            to confirm your schedule.
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            For urgent matters, call{' '}
            <a href="tel:09952638355" className="font-semibold" style={{ color: 'var(--gold)' }}>
              0995 263 8355
            </a>
          </p>
          <button onClick={() => setSuccess(false)} className="btn-gold w-full justify-center">
            Submit Another
          </button>
        </div>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <div className="pt-[68px]" style={{ background: 'var(--bg-canvas)' }}>
        {/* Page header */}
        <div
          className="py-16 border-b"
          style={{ background: 'var(--bg-inset)', borderColor: 'var(--border)' }}
        >
          <div className="container-site">
            <p className="eyebrow mb-5">Online Booking</p>
            <h1 className="font-display font-light leading-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', color: 'var(--text-primary)' }}>
              Book an <em>Appointment</em>
            </h1>
            <p className="mt-4 text-base max-w-lg" style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
              Fill out the form and we&apos;ll confirm your schedule promptly.
              No account or login required.
            </p>
          </div>
        </div>

        <div className="container-site py-16">
          {/* Confidentiality notice */}
          <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 px-5 py-4 rounded-lg"
            style={{
              background: 'var(--gold-pale)',
              border: '1px solid var(--gold-border)',
            }}>
            <AlertCircle size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              All information provided is kept strictly confidential and used only to process your appointment.
              Fields marked <span className="text-red-500 font-semibold">*</span> are required.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="card-luxury p-8 sm:p-10 space-y-7">

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="label-lux">First Name <span className="text-red-500">*</span></label>
                  <input type="text" name="first_name" value={form.first_name}
                    onChange={handleChange} placeholder="e.g. Juan" className="input-luxury" />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1.5">{errors.first_name}</p>}
                </div>
                <div>
                  <label className="label-lux">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" name="last_name" value={form.last_name}
                    onChange={handleChange} placeholder="e.g. dela Cruz" className="input-luxury" />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1.5">{errors.last_name}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="label-lux">Address <span className="text-red-500">*</span></label>
                <input type="text" name="address" value={form.address}
                  onChange={handleChange} placeholder="Street, Barangay, City, Province"
                  className="input-luxury" />
                {errors.address && <p className="text-red-500 text-xs mt-1.5">{errors.address}</p>}
              </div>

              {/* Age */}
              <div className="max-w-[180px]">
                <label className="label-lux">Age <span className="text-red-500">*</span></label>
                <input type="number" name="age" value={form.age}
                  onChange={handleChange} placeholder="e.g. 35" min={1} max={120}
                  className="input-luxury" />
                {errors.age && <p className="text-red-500 text-xs mt-1.5">{errors.age}</p>}
              </div>

              {/* Issue type */}
              <div>
                <label className="label-lux">Appointment / Issue Type <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select name="issue_type" value={form.issue_type}
                    onChange={handleChange} className="input-luxury appearance-none pr-10 cursor-pointer">
                    <option value="">— Select appointment type —</option>
                    {GROUPS.map(g => (
                      <optgroup key={g} label={g}>
                        {ISSUE_TYPES.filter(i => i.group === g).map(item => (
                          <option key={item.label} value={item.label}>{item.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-faint)' }} />
                </div>
                {errors.issue_type && <p className="text-red-500 text-xs mt-1.5">{errors.issue_type}</p>}
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)' }}>
                  Unsure? Select &ldquo;Legal Consultation (General)&rdquo; and describe below.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="label-lux">Brief Description <span className="font-sans normal-case text-xs tracking-normal" style={{ color: 'var(--text-faint)' }}>(Optional)</span></label>
                <textarea name="description" value={form.description}
                  onChange={handleChange} rows={4}
                  placeholder="Briefly describe your concern or what you need help with..."
                  className="input-luxury resize-none" />
              </div>

              <div className="rule-gold" />

              <button type="submit" disabled={loading}
                className="btn-gold w-full justify-center py-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  : <><CalendarCheck size={16} /> Submit Appointment Request</>
                }
              </button>
              <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
                By submitting, your information will be used solely for appointment scheduling purposes.
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}
