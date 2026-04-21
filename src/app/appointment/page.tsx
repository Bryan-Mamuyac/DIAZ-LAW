'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { ISSUE_TYPES } from '@/lib/constants'
import { Footer } from '@/components/Footer'
import {
  CalendarCheck, ChevronDown, Loader2, CheckCircle2,
  AlertCircle, ChevronLeft, ChevronRight, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'

/* ── Types ── */
type FormData = {
  first_name: string
  last_name: string
  address: string
  email: string
  contact_number: string
  appointment_date: string
  appointment_time: string
  issue_type: string
  description: string
}

const INIT: FormData = {
  first_name: '', last_name: '', address: '',
  email: '', contact_number: '',
  appointment_date: '', appointment_time: '',
  issue_type: '', description: '',
}

const GROUPS = Array.from(new Set(ISSUE_TYPES.map(i => i.group)))

/* ── Time slots ── */
const TIME_SLOTS = [
  { label: '8:00 AM',  value: '08:00', period: 'AM' },
  { label: '8:30 AM',  value: '08:30', period: 'AM' },
  { label: '9:00 AM',  value: '09:00', period: 'AM' },
  { label: '9:30 AM',  value: '09:30', period: 'AM' },
  { label: '10:00 AM', value: '10:00', period: 'AM' },
  { label: '10:30 AM', value: '10:30', period: 'AM' },
  { label: '11:00 AM', value: '11:00', period: 'AM' },
  { label: '11:30 AM', value: '11:30', period: 'AM' },
  { label: '12:00 PM', value: '12:00', period: 'AM' },
  { label: '1:00 PM',  value: '13:00', period: 'PM' },
  { label: '1:30 PM',  value: '13:30', period: 'PM' },
  { label: '2:00 PM',  value: '14:00', period: 'PM' },
  { label: '2:30 PM',  value: '14:30', period: 'PM' },
  { label: '3:00 PM',  value: '15:00', period: 'PM' },
  { label: '3:30 PM',  value: '15:30', period: 'PM' },
  { label: '4:00 PM',  value: '16:00', period: 'PM' },
  { label: '4:30 PM',  value: '16:30', period: 'PM' },
  { label: '5:00 PM',  value: '17:00', period: 'PM' },
]

/* ── PH Calendar ── */
const PH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function DatePicker({
  value, onChange,
}: {
  value: string
  onChange: (date: string) => void
}) {
  const today = new Date()
  const [view, setView] = useState({
    month: today.getMonth(),
    year:  today.getFullYear(),
  })
  const [open, setOpen] = useState(false)

  const selected = value ? new Date(value + 'T00:00:00') : null

  const days = useMemo(() => {
    const first = new Date(view.year, view.month, 1)
    const last  = new Date(view.year, view.month + 1, 0)
    const start = first.getDay()
    const arr: (Date | null)[] = Array(start).fill(null)
    for (let d = 1; d <= last.getDate(); d++) {
      arr.push(new Date(view.year, view.month, d))
    }
    return arr
  }, [view])

  const prevMonth = () => {
    setView(v => {
      if (v.month === 0) return { month: 11, year: v.year - 1 }
      return { month: v.month - 1, year: v.year }
    })
  }
  const nextMonth = () => {
    setView(v => {
      if (v.month === 11) return { month: 0, year: v.year + 1 }
      return { month: v.month + 1, year: v.year }
    })
  }

  const isDisabled = (d: Date) => {
    const t = new Date(); t.setHours(0,0,0,0)
    const day = d.getDay()
    return d < t || day === 0 || day === 6
  }

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const displayValue = selected
    ? `${selected.getDate()} ${PH_MONTHS[selected.getMonth()]} ${selected.getFullYear()}`
    : ''

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-luxury text-left w-full flex items-center justify-between"
        style={{ color: displayValue ? 'var(--text-primary)' : 'var(--text-faint)' }}
      >
        <span>{displayValue || 'Select preferred date'}</span>
        <CalendarCheck size={15} style={{ color: 'var(--gold)', flexShrink: 0 }} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-lg)',
            width: 'min(300px, calc(100vw - 2.5rem))',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}
          >
            <button type="button" onClick={prevMonth}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-inset)' }}>
              <ChevronLeft size={14} />
            </button>
            <span className="font-display font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
              {PH_MONTHS[view.month]} {view.year}
            </span>
            <button type="button" onClick={nextMonth}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-inset)' }}>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 px-3 pt-2">
            {DAYS.map(d => (
              <div key={d} className="text-center font-mono-dm py-1"
                style={{ fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.08em' }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
            {days.map((d, i) => {
              if (!d) return <div key={i} />
              const disabled = isDisabled(d)
              const isSelected = selected && fmt(d) === fmt(selected)
              const isToday = fmt(d) === fmt(today)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(fmt(d)); setOpen(false) }}
                  className="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all"
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: "'DM Sans', sans-serif",
                    background: isSelected
                      ? 'var(--gold)'
                      : isToday
                        ? 'var(--gold-pale)'
                        : 'transparent',
                    color: isSelected
                      ? '#fff'
                      : disabled
                        ? 'var(--text-faint)'
                        : 'var(--text-primary)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    border: isToday && !isSelected ? '1px solid var(--gold-border)' : 'none',
                  }}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          <div className="px-3 pb-3">
            <p className="font-mono-dm text-center" style={{ fontSize: '0.6rem', color: 'var(--text-faint)', letterSpacing: '0.1em' }}>
              MON – FRI ONLY · WEEKENDS UNAVAILABLE
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function AppointmentPage() {
  const [form,    setForm]    = useState<FormData>(INIT)
  const [errors,  setErrors]  = useState<Partial<FormData>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM')

  const validate = () => {
    const e: Partial<FormData> = {}
    if (!form.first_name.trim())    e.first_name     = 'Required'
    if (!form.last_name.trim())     e.last_name      = 'Required'
    if (!form.address.trim())       e.address        = 'Required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                    e.email          = 'Valid email required'
    if (!form.contact_number.trim() || !/^[0-9+\- ]{7,15}$/.test(form.contact_number))
                                    e.contact_number = 'Valid contact number required'
    if (!form.appointment_date)     e.appointment_date = 'Please select a date'
    if (!form.appointment_time)     e.appointment_time = 'Please select a time'
    if (!form.issue_type)           e.issue_type     = 'Please select a type'
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
    if (Object.keys(errs).length) {
      setErrors(errs)
      toast.error('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.from('appointments').insert([{
        first_name:       form.first_name.trim(),
        last_name:        form.last_name.trim(),
        address:          form.address.trim(),
        email:            form.email.trim(),
        contact_number:   form.contact_number.trim(),
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        issue_type:       form.issue_type,
        description:      form.description.trim() || null,
        status:           'pending',
      }])
      if (error) throw error
      setSuccess(true)
      setForm(INIT)
    } catch (err) {
      console.error('Appointment submit error:', err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredSlots = TIME_SLOTS.filter(s => s.period === timePeriod)

  if (success) return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 pt-[68px]"
        style={{ background: 'var(--bg-canvas)' }}>
        <div className="card-luxury p-8 sm:p-12 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle2 size={30} className="text-green-500" />
          </div>
          <h2 className="font-display font-medium mb-3"
            style={{ fontSize: '1.75rem', color: 'var(--text-primary)' }}>
            Appointment Submitted
          </h2>
          <div className="rule-gold max-w-[80px] mx-auto mb-5" />
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
            Your request has been received. Atty. Diaz or the secretary will reach out
            to confirm your schedule.
          </p>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            For urgent matters, call{' '}
            <a href="tel:09953622071" className="font-semibold" style={{ color: 'var(--gold)' }}>
              0995 362 2071
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
        <div className="py-10 sm:py-16 border-b"
          style={{ background: 'var(--bg-inset)', borderColor: 'var(--border)' }}>
          <div className="container-site">
            <p className="eyebrow mb-4 sm:mb-5">Online Booking</p>
            <h1 className="font-display font-light leading-tight"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', color: 'var(--text-primary)' }}>
              Book an <em>Appointment</em>
            </h1>
            <p className="mt-3 sm:mt-4 text-base max-w-lg"
              style={{ color: 'var(--text-muted)', fontWeight: 300 }}>
              Fill out the form and we&apos;ll confirm your schedule promptly.
              No account or login required.
            </p>
          </div>
        </div>

        <div className="container-site py-8 sm:py-16">
          {/* Notice */}
          <div className="max-w-2xl mx-auto mb-6 flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4 rounded-lg"
            style={{ background: 'var(--gold-pale)', border: '1px solid var(--gold-border)' }}>
            <AlertCircle size={16} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
              All information is kept strictly confidential and used only to process your appointment.
              Fields marked <span className="text-red-500 font-semibold">*</span> are required.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto">
            <div className="card-luxury p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-7">

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

              {/* Email */}
              <div>
                <label className="label-lux">Email Address <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="e.g. juan@email.com"
                  className="input-luxury" autoComplete="email" />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
              </div>

              {/* Contact Number */}
              <div>
                <label className="label-lux">Contact Number <span className="text-red-500">*</span></label>
                <input type="tel" name="contact_number" value={form.contact_number}
                  onChange={handleChange} placeholder="e.g. 09XX XXX XXXX"
                  className="input-luxury" autoComplete="tel" />
                {errors.contact_number && <p className="text-red-500 text-xs mt-1.5">{errors.contact_number}</p>}
              </div>

              {/* Date Picker */}
              <div>
                <label className="label-lux">Preferred Date <span className="text-red-500">*</span></label>
                <DatePicker
                  value={form.appointment_date}
                  onChange={date => {
                    setForm(p => ({ ...p, appointment_date: date }))
                    if (errors.appointment_date) setErrors(p => ({ ...p, appointment_date: undefined }))
                  }}
                />
                {errors.appointment_date && <p className="text-red-500 text-xs mt-1.5">{errors.appointment_date}</p>}
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)' }}>
                  Office hours: Monday – Friday only. Weekends unavailable.
                </p>
              </div>

              {/* Time Slots */}
              <div>
                <label className="label-lux">Preferred Time <span className="text-red-500">*</span></label>

                {/* AM / PM toggle */}
                <div className="flex gap-2 mb-3">
                  {(['AM', 'PM'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setTimePeriod(p); setForm(prev => ({ ...prev, appointment_time: '' })) }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: '0.08em',
                        background: timePeriod === p ? 'var(--gold)' : 'var(--bg-raised)',
                        color:      timePeriod === p ? '#fff'        : 'var(--text-muted)',
                        border: `1px solid ${timePeriod === p ? 'var(--gold)' : 'var(--border)'}`,
                      }}
                    >
                      <Clock size={12} />
                      {p === 'AM' ? 'Morning (AM)' : 'Afternoon (PM)'}
                    </button>
                  ))}
                </div>

                {/* Time grid — 3 cols mobile, 4 cols sm+ */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {filteredSlots.map(slot => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => {
                        setForm(p => ({ ...p, appointment_time: slot.value }))
                        if (errors.appointment_time) setErrors(p => ({ ...p, appointment_time: undefined }))
                      }}
                      className="py-2.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        background: form.appointment_time === slot.value ? 'var(--gold)' : 'var(--bg-raised)',
                        color:      form.appointment_time === slot.value ? '#fff'        : 'var(--text-secondary)',
                        border: `1px solid ${form.appointment_time === slot.value ? 'var(--gold)' : 'var(--border)'}`,
                      }}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
                {errors.appointment_time && <p className="text-red-500 text-xs mt-1.5">{errors.appointment_time}</p>}
              </div>

              {/* Issue type */}
              <div>
                <label className="label-lux">Appointment / Issue Type <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select name="issue_type" value={form.issue_type}
                    onChange={handleChange}
                    className="input-luxury appearance-none pr-10 cursor-pointer"
                    style={{ fontSize: '0.875rem' }}>
                    <option value="">— Select appointment type —</option>
                    {GROUPS.map(g => (
                      <optgroup key={g} label={g}>
                        {ISSUE_TYPES.filter(i => i.group === g).map(item => (
                          <option key={item.label} value={item.label}>{item.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <ChevronDown size={14}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-faint)' }} />
                </div>
                {errors.issue_type && <p className="text-red-500 text-xs mt-1.5">{errors.issue_type}</p>}
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-faint)' }}>
                  Unsure? Select &ldquo;Legal Consultation (General)&rdquo; and describe below.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="label-lux">
                  Brief Description{' '}
                  <span className="font-sans normal-case text-xs tracking-normal"
                    style={{ color: 'var(--text-faint)' }}>(Optional)</span>
                </label>
                <textarea name="description" value={form.description}
                  onChange={handleChange} rows={4}
                  placeholder="Briefly describe your concern or what you need help with..."
                  className="input-luxury resize-none" />
              </div>

              <div className="rule-gold" />

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full justify-center py-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
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
