'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, Appointment, ContactMessage } from '@/lib/supabase'
import {
  CalendarCheck, Mail, Users, Clock, CheckCircle2, Eye,
  ChevronDown, RefreshCw, LayoutDashboard, MessageSquare,
  Search, Download, Loader2, X, Lock, Delete, Scale,
  LogOut, Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const ADMIN_PIN   = '121212'
const SESSION_KEY = 'diazlaw_admin_auth'
const MAX_ATTEMPTS = 5
const LOCK_SECONDS = 180 // 3 minutes

/* ══════════════════════════════════════
   ADMIN NAVBAR (separate from site nav)
══════════════════════════════════════ */
function AdminNavbar({ onLock }: { onLock: () => void }) {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: '#0A1628',
        borderColor: 'rgba(201,168,76,0.2)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <Scale size={15} style={{ color: '#C9A84C' }} />
            </div>
            <div>
              <span
                className="font-display font-semibold tracking-wide"
                style={{ color: '#EDE8DE', fontSize: '0.9rem' }}
              >
                DIAZ LAW
              </span>
              <span style={{ color: 'rgba(201,168,76,0.6)', margin: '0 8px', fontSize: '0.75rem' }}>|</span>
              <span
                className="font-mono-dm tracking-widest uppercase"
                style={{ color: 'rgba(201,168,76,0.7)', fontSize: '0.6rem' }}
              >
                Admin Portal
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <Shield size={10} style={{ color: '#22c55e' }} />
              <span className="font-mono-dm text-xs" style={{ color: '#22c55e', fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                SECURED
              </span>
            </div>
            <button
              onClick={onLock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#fca5a5',
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.2)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'
              }}
            >
              <LogOut size={12} /> Lock Session
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ══════════════════════════════════════
   PIN SCREEN
══════════════════════════════════════ */
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin,       setPin]       = useState('')
  const [shake,     setShake]     = useState(false)
  const [attempts,  setAttempts]  = useState(0)
  const [locked,    setLocked]    = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Focus hidden input on mount for keyboard support
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Countdown timer
  useEffect(() => {
    if (locked && lockTimer > 0) {
      timerRef.current = setTimeout(() => setLockTimer(t => t - 1), 1000)
    } else if (locked && lockTimer === 0 && attempts > 0) {
      setLocked(false)
      setAttempts(0)
      setPin('')
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [locked, lockTimer, attempts])

  const checkPin = useCallback((fullPin: string) => {
    if (fullPin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onSuccess()
    } else {
      setShake(true)
      setTimeout(() => { setShake(false); setPin('') }, 550)
      const n = attempts + 1
      setAttempts(n)
      if (n >= MAX_ATTEMPTS) {
        setLocked(true)
        setLockTimer(LOCK_SECONDS)
        toast.error(`Too many attempts. Locked for ${LOCK_SECONDS / 60} minutes.`)
      } else {
        toast.error(`Incorrect PIN — ${MAX_ATTEMPTS - n} attempt(s) remaining.`)
      }
    }
  }, [attempts, onSuccess])

  // Keyboard handler via hidden input
  const handleKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPin(raw)
    if (raw.length === 6) {
      e.target.value = ''
      checkPin(raw)
    }
  }

  // Numpad click
  const handleNumpad = (key: string) => {
    if (locked) return
    if (key === 'del') { setPin(p => p.slice(0, -1)); return }
    if (pin.length >= 6) return
    const next = pin + key
    setPin(next)
    if (next.length === 6) checkPin(next)
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del']
  const mins = Math.floor(lockTimer / 60)
  const secs = lockTimer % 60

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#07090F' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Pin screen navbar */}
      <header
        className="border-b"
        style={{ background: '#0A1628', borderColor: 'rgba(201,168,76,0.15)' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="flex items-center h-14 gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <Scale size={15} style={{ color: '#C9A84C' }} />
            </div>
            <span className="font-display font-semibold" style={{ color: '#EDE8DE', fontSize: '0.9rem' }}>
              DIAZ LAW
            </span>
            <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '0.75rem' }}>|</span>
            <span className="font-mono-dm tracking-widest uppercase"
              style={{ color: 'rgba(201,168,76,0.6)', fontSize: '0.6rem' }}>
              Admin Portal
            </span>
          </div>
        </div>
      </header>

      {/* PIN form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <style>{`@keyframes pinShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}.pin-shake{animation:pinShake 0.5s ease;}`}</style>

        {/* Hidden keyboard input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          maxLength={6}
          onChange={handleKeyInput}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: '1px',
            height: '1px',
          }}
          disabled={locked}
          autoComplete="off"
        />

        <div style={{ width: '100%', maxWidth: '360px' }}>
          {/* Header text */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
            >
              <Lock size={26} style={{ color: '#C9A84C' }} />
            </div>
            <h1 className="font-display font-light text-2xl mb-1" style={{ color: '#EDE8DE' }}>
              Admin Access
            </h1>
            <p className="font-mono-dm text-xs tracking-widest uppercase"
              style={{ color: 'rgba(201,168,76,0.6)' }}>
              Enter your PIN to continue
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8"
            style={{
              background: '#0C1120',
              border: '1px solid rgba(201,168,76,0.15)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Keyboard hint */}
            <p className="text-center font-mono-dm mb-4"
              style={{ fontSize: '0.6rem', color: 'rgba(201,168,76,0.5)', letterSpacing: '0.1em' }}>
              ⌨ TYPE ON KEYBOARD OR CLICK BELOW
            </p>

            {/* Lock status */}
            {locked && (
              <div
                className="mb-4 px-4 py-2.5 rounded-lg text-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <p className="font-mono-dm text-xs font-bold" style={{ color: '#fca5a5', letterSpacing: '0.08em' }}>
                  LOCKED — {mins}:{String(secs).padStart(2, '0')} remaining
                </p>
              </div>
            )}

            {/* Attempts warning */}
            {!locked && attempts > 0 && (
              <div
                className="mb-4 px-4 py-2 rounded-lg text-center"
                style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
              >
                <p className="font-mono-dm text-xs" style={{ color: '#fcd34d', letterSpacing: '0.06em' }}>
                  {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
                </p>
              </div>
            )}

            {/* PIN dots */}
            <div className={`flex justify-center gap-3 my-6 ${shake ? 'pin-shake' : ''}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-150"
                  style={{
                    width: '14px',
                    height: '14px',
                    background: i < pin.length ? '#C9A84C' : 'transparent',
                    border: `2px solid ${i < pin.length ? '#C9A84C' : 'rgba(201,168,76,0.3)'}`,
                    transform: i < pin.length ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2.5">
              {KEYS.map((key, idx) => {
                if (key === '') return <div key={idx} />
                const isDel = key === 'del'
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => { handleNumpad(key); inputRef.current?.focus() }}
                    disabled={locked || (!isDel && pin.length >= 6)}
                    className="h-14 rounded-xl font-medium text-lg flex items-center justify-center transition-all duration-100 active:scale-90 disabled:opacity-30 select-none"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: isDel ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
                      color: isDel ? '#fca5a5' : '#EDE8DE',
                      border: `1px solid ${isDel ? 'rgba(239,68,68,0.2)' : 'rgba(237,232,222,0.1)'}`,
                    }}
                    onMouseDown={e => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        isDel ? 'rgba(239,68,68,0.18)' : 'rgba(201,168,76,0.15)'
                    }}
                    onMouseUp={e => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        isDel ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        isDel ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)'
                    }}
                  >
                    {isDel ? <Delete size={18} /> : key}
                  </button>
                )
              })}
            </div>

            <p className="font-mono-dm text-xs text-center mt-5"
              style={{ color: 'rgba(237,232,222,0.2)', letterSpacing: '0.1em' }}>
              AUTHORIZED PERSONNEL ONLY
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   STATUS CONFIG
══════════════════════════════════════ */
type AppStatus = Appointment['status']
const STATUS_LABEL: Record<AppStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled',
}
const STATUS_STYLE: Record<AppStatus, { bg: string; color: string; border: string }> = {
  pending:   { bg: 'rgba(234,179,8,0.1)',   color: '#B45309', border: 'rgba(234,179,8,0.25)' },
  confirmed: { bg: 'rgba(59,130,246,0.08)', color: '#1D4ED8', border: 'rgba(59,130,246,0.2)' },
  completed: { bg: 'rgba(34,197,94,0.08)',  color: '#15803D', border: 'rgba(34,197,94,0.2)'  },
  cancelled: { bg: 'rgba(239,68,68,0.08)',  color: '#B91C1C', border: 'rgba(239,68,68,0.2)'  },
}

function StatusBadge({ status }: { status: AppStatus }) {
  const s = STATUS_STYLE[status]
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '0.2rem 0.6rem', borderRadius: '4px',
      fontFamily: "'DM Mono', monospace", fontSize: '0.6rem',
      fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
      display: 'inline-flex', alignItems: 'center',
    }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

/* ══════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════ */
type Tab = 'appointments' | 'messages'
type StatusFilter = 'all' | AppStatus

function AdminDashboard({ onLock }: { onLock: () => void }) {
  const [tab,          setTab]          = useState<Tab>('appointments')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [messages,     setMessages]     = useState<ContactMessage[]>([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search,       setSearch]       = useState('')
  const [selected,     setSelected]     = useState<Appointment | null>(null)
  const [selectedMsg,  setSelectedMsg]  = useState<ContactMessage | null>(null)
  const [updatingId,   setUpdatingId]   = useState<string | null>(null)
  const [dateVal,      setDateVal]      = useState('')
  const [notes,        setNotes]        = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: appts }, { data: msgs }] = await Promise.all([
      supabase.from('appointments').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
    ])
    setAppointments((appts as Appointment[]) || [])
    setMessages((msgs as ContactMessage[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateStatus = async (id: string, status: AppStatus) => {
    setUpdatingId(id)
    await supabase.from('appointments').update({ status, notes: notes || undefined }).eq('id', id)
    setAppointments(p => p.map(a => a.id === id ? { ...a, status } : a))
    if (selected?.id === id) setSelected(p => p ? { ...p, status } : null)
    toast.success(`Status → ${STATUS_LABEL[status]}`)
    setUpdatingId(null)
  }

  const setDate = async (id: string) => {
    if (!dateVal) return
    await supabase.from('appointments').update({ appointment_date: dateVal }).eq('id', id)
    setAppointments(p => p.map(a => a.id === id ? { ...a, appointment_date: dateVal } : a))
    if (selected?.id === id) setSelected(p => p ? { ...p, appointment_date: dateVal } : null)
    toast.success('Date saved!')
  }

  const saveNotes = async (id: string) => {
    await supabase.from('appointments').update({ notes }).eq('id', id)
    toast.success('Notes saved.')
  }

  const markRead = async (id: string) => {
    await supabase.from('contact_messages').update({ read: true }).eq('id', id)
    setMessages(p => p.map(m => m.id === id ? { ...m, read: true } : m))
  }

  const filtered = appointments.filter(a => {
    const okStatus = statusFilter === 'all' || a.status === statusFilter
    const okSearch = !search || `${a.first_name} ${a.last_name} ${a.issue_type}`
      .toLowerCase().includes(search.toLowerCase())
    return okStatus && okSearch
  })

  const stats = {
    total:     appointments.length,
    pending:   appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    unread:    messages.filter(m => !m.read).length,
  }

  const exportCSV = () => {
    const h = ['ID','First','Last','Email','Contact','Address','Issue','Status','Appt Date','Appt Time','Submitted']
    const r = filtered.map((a: Appointment & { email?: string; contact_number?: string; appointment_time?: string }) => [
      a.id, a.first_name, a.last_name,
      (a as Record<string, unknown>).email || '',
      (a as Record<string, unknown>).contact_number || '',
      `"${a.address}"`, `"${a.issue_type}"`, a.status,
      a.appointment_date || '',
      (a as Record<string, unknown>).appointment_time || '',
      format(new Date(a.created_at!), 'MMM d yyyy HH:mm'),
    ])
    const csv = [h, ...r].map(x => x.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const el = document.createElement('a'); el.href = url; el.download = 'appointments.csv'; el.click()
    URL.revokeObjectURL(url)
  }

  // Shared card style
  const card: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-md)',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      <AdminNavbar onLock={onLock} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total',       value: stats.total,     icon: CalendarCheck, color: '#C9A84C' },
            { label: 'Pending',     value: stats.pending,   icon: Clock,         color: '#D97706' },
            { label: 'Confirmed',   value: stats.confirmed, icon: CheckCircle2,  color: '#2563EB' },
            { label: 'Completed',   value: stats.completed, icon: Users,         color: '#16A34A' },
            { label: 'Unread Msgs', value: stats.unread,    icon: Mail,          color: '#DC2626' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ ...card, padding: '1.25rem' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono-dm text-xs tracking-wider uppercase"
                  style={{ color: 'var(--text-muted)' }}>{label}</p>
                <Icon size={14} style={{ color }} />
              </div>
              <p className="font-display font-medium"
                style={{ fontSize: '2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {([
              { id: 'appointments' as Tab, label: 'Appointments', icon: LayoutDashboard, badge: filtered.length },
              { id: 'messages'     as Tab, label: 'Messages',     icon: MessageSquare,   badge: stats.unread },
            ] as const).map(({ id, label, icon: Icon, badge }) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  background: tab === id ? 'var(--gold)' : 'var(--bg-surface)',
                  color:      tab === id ? '#fff'        : 'var(--text-muted)',
                  border: `1px solid ${tab === id ? 'var(--gold)' : 'var(--border)'}`,
                }}>
                <Icon size={13} />
                {label}
                {badge > 0 && (
                  <span style={{
                    background: tab === id ? 'rgba(255,255,255,0.25)' : 'var(--gold-pale)',
                    color:      tab === id ? '#fff'                   : 'var(--gold)',
                    padding: '0.1rem 0.4rem', borderRadius: '4px',
                    fontSize: '0.65rem', fontWeight: 700,
                  }}>{badge}</span>
                )}
              </button>
            ))}
          </div>
          <button onClick={fetchAll}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
              background: 'var(--bg-surface)',
            }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* ── Appointments Tab ── */}
        {tab === 'appointments' && (
          <>
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1" style={{ minWidth: '200px' }}>
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-faint)' }} />
                <input type="text" placeholder="Search by name or issue…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="input-luxury pl-9 py-2 text-sm" style={{ width: '100%' }} />
              </div>
              <div className="relative">
                <select value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                  className="input-luxury py-2 text-sm appearance-none cursor-pointer"
                  style={{ paddingRight: '2.5rem', minWidth: '150px' }}>
                  <option value="all">All Status</option>
                  {(['pending','confirmed','completed','cancelled'] as AppStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-faint)' }} />
              </div>
              <button onClick={exportCSV}
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl border transition-all"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-surface)',
                }}>
                <Download size={13} /> Export CSV
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={26} className="animate-spin" style={{ color: 'var(--gold)' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ ...card, padding: '4rem', textAlign: 'center' }}>
                <CalendarCheck size={28} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                <p className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>No appointments found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div style={{ ...card, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                        {['#','Client','Issue','Status','Preferred Date','Time','Submitted',''].map(h => (
                          <th key={h} style={{
                            textAlign: 'left', padding: '0.875rem 1.25rem',
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '0.6rem', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: 'var(--text-faint)',
                            fontWeight: 500, whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((appt, i) => {
                        const a = appt as Appointment & { appointment_time?: string }
                        return (
                          <tr key={a.id}
                            style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
                            onMouseLeave={e => (e.currentTarget.style.background = '')}>
                            <td style={{ padding: '1rem 1.25rem', color: 'var(--text-faint)', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem' }}>
                              {i + 1}
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                {a.first_name} {a.last_name}
                              </p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>
                                {a.address}
                              </p>
                            </td>
                            <td style={{ padding: '1rem 1.25rem', maxWidth: '180px' }}>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                {a.issue_type}
                              </p>
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <StatusBadge status={a.status} />
                            </td>
                            <td style={{ padding: '1rem 1.25rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {a.appointment_date ? format(new Date(a.appointment_date + 'T00:00:00'), 'MMM d, yyyy') : '—'}
                            </td>
                            <td style={{ padding: '1rem 1.25rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {a.appointment_time || '—'}
                            </td>
                            <td style={{ padding: '1rem 1.25rem', fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy') : '—'}
                            </td>
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <button
                                onClick={() => { setSelected(a); setNotes(a.notes || ''); setDateVal(a.appointment_date || '') }}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                                style={{
                                  background: 'var(--gold-pale)',
                                  color: 'var(--gold)',
                                  border: '1px solid var(--gold-border)',
                                  fontFamily: "'DM Sans', sans-serif",
                                  whiteSpace: 'nowrap',
                                }}>
                                <Eye size={11} /> View
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Messages Tab ── */}
        {tab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={26} className="animate-spin" style={{ color: 'var(--gold)' }} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ ...card, padding: '4rem', textAlign: 'center' }}>
                <Mail size={28} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                <p className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>No messages yet</p>
              </div>
            ) : messages.map(msg => (
              <div key={msg.id}
                style={{
                  ...card,
                  padding: '1.25rem',
                  cursor: 'pointer',
                  borderLeft: !msg.read ? '3px solid var(--gold)' : '3px solid transparent',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onClick={() => { setSelectedMsg(msg); if (!msg.read) markRead(msg.id!) }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-lg)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'
                  ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{msg.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{msg.email}</p>
                      {!msg.read && (
                        <span style={{
                          background: 'var(--gold-pale)', color: 'var(--gold)',
                          border: '1px solid var(--gold-border)',
                          padding: '0.1rem 0.5rem', borderRadius: '4px',
                          fontFamily: "'DM Mono', monospace", fontSize: '0.55rem',
                          fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                        }}>New</span>
                      )}
                    </div>
                    <p style={{ fontWeight: 500, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {msg.subject}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.message}
                    </p>
                  </div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: 'var(--text-faint)', flexShrink: 0 }}>
                    {msg.created_at ? format(new Date(msg.created_at), 'MMM d') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Appointment Detail Modal ── */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div style={{ ...card, width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-strong)' }}>
            {/* Modal header */}
            <div style={{
              position: 'sticky', top: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)',
              background: 'var(--bg-surface)', zIndex: 1,
            }}>
              <div>
                <p className="font-display font-medium" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Appointment Details
                </p>
                <p className="font-mono-dm text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  ID: {selected.id?.slice(0, 8)}…
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem 1.75rem' }}>
              {/* Client info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {([
                  ['Full Name', `${selected.first_name} ${selected.last_name}`, true],
                  ['Issue Type', selected.issue_type, true],
                  ['Address', selected.address, true],
                  ['Email', (selected as Record<string,unknown>).email as string || '—', false],
                  ['Contact', (selected as Record<string,unknown>).contact_number as string || '—', false],
                  ['Preferred Date', selected.appointment_date ? format(new Date(selected.appointment_date + 'T00:00:00'), 'MMMM d, yyyy') : '—', false],
                  ['Preferred Time', (selected as Record<string,unknown>).appointment_time as string || '—', false],
                ] as [string, string, boolean][]).map(([label, val, full]) => (
                  <div key={label} style={full ? { gridColumn: '1 / -1' } : {}}>
                    <p className="label-lux mb-1">{label}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 400 }}>{val}</p>
                  </div>
                ))}
                {selected.description && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className="label-lux mb-1">Description</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selected.description}</p>
                  </div>
                )}
              </div>

              <div className="rule-gold" />

              {/* Status */}
              <div style={{ marginBottom: '1.25rem' }}>
                <p className="label-lux mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['pending','confirmed','completed','cancelled'] as AppStatus[]).map(s => {
                    const st = STATUS_STYLE[s]
                    const isActive = selected.status === s
                    return (
                      <button key={s}
                        disabled={!!updatingId}
                        onClick={() => updateStatus(selected.id!, s)}
                        style={{
                          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                          padding: '0.3rem 0.75rem', borderRadius: '6px',
                          fontFamily: "'DM Mono', monospace", fontSize: '0.65rem',
                          fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
                          cursor: 'pointer', transition: 'all 0.15s',
                          outline: isActive ? `2px solid ${st.color}` : 'none',
                          outlineOffset: '2px',
                          opacity: updatingId ? 0.5 : 1,
                        }}>
                        {updatingId === selected.id ? '…' : STATUS_LABEL[s]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Set Date */}
              <div style={{ marginBottom: '1.25rem' }}>
                <p className="label-lux mb-2">Confirm Appointment Date</p>
                <div className="flex gap-2">
                  <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)}
                    className="input-luxury py-2 text-sm" style={{ flex: 1 }} />
                  <button onClick={() => setDate(selected.id!)} disabled={!dateVal}
                    className="btn-gold py-2 px-4 text-xs disabled:opacity-40">Set</button>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <p className="label-lux mb-2">Secretary Notes</p>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Internal notes (admin-only)…"
                  className="input-luxury text-sm resize-none" />
                <button onClick={() => saveNotes(selected.id!)} className="btn-outline text-xs py-2 px-4 mt-2">
                  Save Notes
                </button>
              </div>

              <p className="font-mono-dm text-xs" style={{ color: 'var(--text-faint)' }}>
                Submitted: {selected.created_at ? format(new Date(selected.created_at), 'MMMM d, yyyy · h:mm a') : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Message Modal ── */}
      {selectedMsg && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedMsg(null) }}
        >
          <div style={{ ...card, width: '100%', maxWidth: '500px', border: '1px solid var(--border-strong)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border)',
            }}>
              <p className="font-display font-medium" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Message</p>
              <button onClick={() => setSelectedMsg(null)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><p className="label-lux mb-1">From</p><p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{selectedMsg.name}</p></div>
                <div><p className="label-lux mb-1">Email</p><a href={`mailto:${selectedMsg.email}`} style={{ fontSize: '0.875rem', color: 'var(--gold)', fontWeight: 500 }}>{selectedMsg.email}</a></div>
                <div style={{ gridColumn: '1 / -1' }}><p className="label-lux mb-1">Subject</p><p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{selectedMsg.subject}</p></div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p className="label-lux mb-2">Message</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'var(--bg-raised)', padding: '1rem', borderRadius: '8px' }}>
                    {selectedMsg.message}
                  </p>
                </div>
              </div>
              <div className="rule-gold" />
              <p className="font-mono-dm text-xs" style={{ color: 'var(--text-faint)' }}>
                Received: {selectedMsg.created_at ? format(new Date(selectedMsg.created_at), 'MMMM d, yyyy · h:mm a') : ''}
              </p>
              <a href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                className="btn-gold w-full justify-center text-xs py-3" style={{ textAlign: 'center' }}>
                <Mail size={13} /> Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════ */
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking,      setChecking]      = useState(true)

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem(SESSION_KEY) === '1')
    setChecking(false)
  }, [])

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthenticated(false)
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07090F' }}>
      <Loader2 size={24} className="animate-spin" style={{ color: '#C9A84C' }} />
    </div>
  )

  return authenticated
    ? <AdminDashboard onLock={handleLock} />
    : <PinScreen onSuccess={() => setAuthenticated(true)} />
}
