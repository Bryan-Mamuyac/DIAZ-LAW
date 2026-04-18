'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ISSUE_TYPES } from '@/lib/constants'
import { Footer } from '@/components/Footer'
import { CalendarCheck, ChevronDown, Loader2, CheckCircle2, AlertCircle, User, MapPin, Hash, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

type FormData = {
  first_name: string
  last_name: string
  address: string
  age: string
  issue_type: string
  description: string
}

const initialForm: FormData = {
  first_name: '',
  last_name: '',
  address: '',
  age: '',
  issue_type: '',
  description: '',
}

const groups = Array.from(new Set(ISSUE_TYPES.map(i => i.group)))

export default function AppointmentPage() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const e: Partial<FormData> = {}
    if (!form.first_name.trim()) e.first_name = 'First name is required.'
    if (!form.last_name.trim()) e.last_name = 'Last name is required.'
    if (!form.address.trim()) e.address = 'Address is required.'
    if (!form.age || isNaN(Number(form.age)) || Number(form.age) < 1 || Number(form.age) > 120)
      e.age = 'Please enter a valid age (1–120).'
    if (!form.issue_type) e.issue_type = 'Please select an appointment type.'
    return e
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from('appointments').insert([{
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        address: form.address.trim(),
        age: Number(form.age),
        issue_type: form.issue_type,
        description: form.description.trim() || null,
        status: 'pending',
      }])

      if (error) throw error

      setSuccess(true)
      setForm(initialForm)
      toast.success('Appointment submitted successfully!')
    } catch (err: unknown) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <>
        <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
          <div className="card p-10 max-w-md w-full mx-4 text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
            >
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Appointment Submitted!
            </h2>
            <p className="text-base mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Thank you! Your appointment request has been received. Atty. Diaz or the secretary will reach out to confirm your schedule.
            </p>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              For urgent concerns, you may call or message directly at{' '}
              <a href="tel:09952638355" className="font-semibold" style={{ color: 'var(--navy-accent)' }}>
                0995 263 8355
              </a>
            </p>
            <button onClick={() => setSuccess(false)} className="btn-primary w-full">
              Submit Another Appointment
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="pt-28 pb-16">
        <div className="section-container">
          {/* Header */}
          <div className="text-center mb-12">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ backgroundColor: 'rgba(14, 68, 184, 0.1)' }}
            >
              <CalendarCheck size={30} style={{ color: 'var(--navy-accent)' }} />
            </div>
            <h1 className="section-title mb-3">Book an Appointment</h1>
            <p className="section-subtitle max-w-lg mx-auto">
              Fill out the form below and Atty. Diaz will get back to you to confirm your schedule. No account needed.
            </p>
            <div className="gold-divider max-w-xs mx-auto" />
          </div>

          {/* Notice */}
          <div
            className="max-w-2xl mx-auto mb-8 p-4 rounded-xl flex items-start gap-3 border"
            style={{ backgroundColor: 'rgba(14,68,184,0.06)', borderColor: 'rgba(14,68,184,0.2)' }}
          >
            <AlertCircle size={18} style={{ color: 'var(--navy-accent)' }} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              All information provided is kept strictly confidential and is only used to process your appointment.
              Fields marked with <span className="text-red-500 font-bold">*</span> are required.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="card p-8 space-y-6">

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label flex items-center gap-1.5">
                    <User size={13} /> First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="e.g. Juan"
                    className="input-field"
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.first_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label flex items-center gap-1.5">
                    <User size={13} /> Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="e.g. dela Cruz"
                    className="input-field"
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.last_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <MapPin size={13} /> Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street, Barangay, City, Province"
                  className="input-field"
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.address}
                  </p>
                )}
              </div>

              {/* Age */}
              <div className="max-w-xs">
                <label className="label flex items-center gap-1.5">
                  <Hash size={13} /> Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="e.g. 35"
                  min={1}
                  max={120}
                  className="input-field"
                />
                {errors.age && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.age}
                  </p>
                )}
              </div>

              {/* Issue Type */}
              <div>
                <label className="label flex items-center gap-1.5">
                  <FileText size={13} /> Appointment / Issue Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="issue_type"
                    value={form.issue_type}
                    onChange={handleChange}
                    className="input-field appearance-none pr-10 cursor-pointer"
                  >
                    <option value="">— Select your appointment type —</option>
                    {groups.map(group => (
                      <optgroup key={group} label={group}>
                        {ISSUE_TYPES.filter(i => i.group === group).map(item => (
                          <option key={item.label} value={item.label}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>
                {errors.issue_type && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.issue_type}
                  </p>
                )}
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Not sure? Select "Legal Consultation (General)" and describe below.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="label">
                  Brief Description{' '}
                  <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Briefly describe your concern or what you need help with (optional but helpful)..."
                  className="input-field resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CalendarCheck size={18} />
                    Submit Appointment Request
                  </>
                )}
              </button>

              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                By submitting, you agree that your information will be used solely for appointment scheduling purposes.
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  )
}
