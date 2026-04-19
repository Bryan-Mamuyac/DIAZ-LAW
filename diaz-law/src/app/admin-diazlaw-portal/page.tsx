'use client'

export const dynamic = 'force-dynamic'


import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, Appointment, ContactMessage } from '@/lib/supabase'
import {
  CalendarCheck, Mail, Users, Clock, CheckCircle2, Eye,
  ChevronDown, RefreshCw, LayoutDashboard, MessageSquare,
  Search, Download, Loader2, X, Lock, Delete, Scale,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const ADMIN_PIN   = '121212'
const SESSION_KEY = 'diazlaw_admin_auth'

/* ══════════════════════════════════════
   PIN SCREEN
══════════════════════════════════════ */
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin,       setPin]       = useState('')
  const [shake,     setShake]     = useState(false)
  const [attempts,  setAttempts]  = useState(0)
  const [locked,    setLocked]    = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (locked && lockTimer > 0) {
      timerRef.current = setTimeout(() => setLockTimer(t => t - 1), 1000)
    } else if (locked && lockTimer === 0 && attempts > 0) {
      setLocked(false); setAttempts(0)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [locked, lockTimer, attempts])

  const handleKey = (digit: string) => {
    if (locked) return
    if (digit === 'del') { setPin(p => p.slice(0, -1)); return }
    if (pin.length >= 6) return
    const next = pin + digit
    setPin(next)
    if (next.length < 6) return

    if (next === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onSuccess()
    } else {
      setShake(true)
      setTimeout(() => { setShake(false); setPin('') }, 550)
      const n = attempts + 1; setAttempts(n)
      if (n >= 3) { setLocked(true); setLockTimer(30); toast.error('Locked for 30 seconds.') }
      else toast.error(`Incorrect PIN — ${3 - n} attempt(s) left.`)
    }
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del']

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-canvas)' }}>
      <style>{`.pin-shake{animation:pinShake 0.5s ease;}`}</style>

      <div className="w-full max-w-[320px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--navy)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <Scale size={24} style={{ color: 'var(--gold)' }} />
          </div>
          <p className="font-display font-medium text-2xl" style={{ color: 'var(--text-primary)' }}>
            DIAZ LAW
          </p>
          <p className="font-mono-dm text-xs tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted)' }}>
            Admin Portal
          </p>
        </div>

        {/* PIN Card */}
        <div className="card-luxury p-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock size={13} style={{ color: 'var(--text-muted)' }} />
            <p className="font-mono-dm text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
              Enter Admin PIN
            </p>
          </div>

          {locked && (
            <p className="text-center text-xs text-red-500 mt-2 font-semibold">
              Retry in {lockTimer}s
            </p>
          )}

          {/* Dots */}
          <div className={`flex justify-center gap-3 my-7 ${shake ? 'pin-shake' : ''}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}
                className="w-3.5 h-3.5 rounded-full border transition-all duration-150"
                style={{
                  background: i < pin.length ? 'var(--gold)' : 'transparent',
                  borderColor: i < pin.length ? 'var(--gold)' : 'var(--border-strong)',
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
                <button key={idx}
                  onClick={() => handleKey(key)}
                  disabled={locked || (!isDel && pin.length >= 6)}
                  className="h-14 rounded-lg font-medium text-lg flex items-center justify-center
                             transition-all duration-100 active:scale-90 disabled:opacity-30 select-none"
                  style={{
                    background: isDel ? 'rgba(239,68,68,0.06)' : 'var(--bg-raised)',
                    color: isDel ? '#ef4444' : 'var(--text-primary)',
                    border: '1px solid var(--border-strong)',
                    fontFamily: isDel ? 'inherit' : "'DM Sans', sans-serif",
                  }}
                  onMouseDown={e => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      isDel ? 'rgba(239,68,68,0.14)' : 'var(--bg-inset)'
                  }}
                  onMouseUp={e => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      isDel ? 'rgba(239,68,68,0.06)' : 'var(--bg-raised)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      isDel ? 'rgba(239,68,68,0.06)' : 'var(--bg-raised)'
                  }}
                >
                  {isDel ? <Delete size={17} /> : key}
                </button>
              )
            })}
          </div>

          <p className="font-mono-dm text-xs text-center mt-6" style={{ color: 'var(--text-faint)' }}>
            Authorized personnel only
          </p>
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
const STATUS_CLASS: Record<AppStatus, string> = {
  pending:   'badge badge-pending',
  confirmed: 'badge badge-confirmed',
  completed: 'badge badge-completed',
  cancelled: 'badge badge-cancelled',
}

/* ══════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════ */
type Tab = 'appointments' | 'messages'
type StatusFilter = 'all' | AppStatus

function AdminDashboard() {
  const [tab,         setTab]         = useState<Tab>('appointments')
  const [appointments,setAppointments]= useState<Appointment[]>([])
  const [messages,    setMessages]    = useState<ContactMessage[]>([])
  const [loading,     setLoading]     = useState(true)
  const [statusFilter,setStatusFilter]= useState<StatusFilter>('all')
  const [search,      setSearch]      = useState('')
  const [selected,    setSelected]    = useState<Appointment | null>(null)
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null)
  const [updatingId,  setUpdatingId]  = useState<string | null>(null)
  const [dateVal,     setDateVal]     = useState('')
  const [notes,       setNotes]       = useState('')

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
    const { error } = await supabase.from('appointments')
      .update({ status, notes: notes || undefined }).eq('id', id)
    if (!error) {
      setAppointments(p => p.map(a => a.id === id ? { ...a, status } : a))
      if (selected?.id === id) setSelected(p => p ? { ...p, status } : null)
      toast.success(`Status → ${STATUS_LABEL[status]}`)
    } else toast.error('Update failed.')
    setUpdatingId(null)
  }

  const setDate = async (id: string) => {
    if (!dateVal) return
    const { error } = await supabase.from('appointments')
      .update({ appointment_date: dateVal }).eq('id', id)
    if (!error) {
      setAppointments(p => p.map(a => a.id === id ? { ...a, appointment_date: dateVal } : a))
      if (selected?.id === id) setSelected(p => p ? { ...p, appointment_date: dateVal } : null)
      toast.success('Date saved!')
    }
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
    const ok = statusFilter === 'all' || a.status === statusFilter
    const q  = !search || `${a.first_name} ${a.last_name} ${a.issue_type}`.toLowerCase().includes(search.toLowerCase())
    return ok && q
  })

  const stats = {
    total:     appointments.length,
    pending:   appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    unread:    messages.filter(m => !m.read).length,
  }

  const exportCSV = () => {
    const h = ['ID','First','Last','Age','Address','Issue','Status','Appt Date','Submitted']
    const r = filtered.map(a => [
      a.id, a.first_name, a.last_name, a.age, `"${a.address}"`,
      `"${a.issue_type}"`, a.status, a.appointment_date || '',
      format(new Date(a.created_at!), 'MMM d yyyy HH:mm'),
    ])
    const csv = [h, ...r].map(x => x.join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = 'appointments.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleLock = () => { sessionStorage.removeItem(SESSION_KEY); window.location.reload() }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-canvas)' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="container-site">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: 'var(--navy)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <Scale size={14} style={{ color: 'var(--gold)' }} />
              </div>
              <span className="font-display font-medium text-base" style={{ color: 'var(--text-primary)' }}>
                DIAZ LAW
              </span>
              <span className="text-sm" style={{ color: 'var(--border-strong)' }}>/</span>
              <span className="font-mono-dm text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                Admin
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAll} className="btn-ghost text-xs">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button onClick={handleLock} className="btn-ghost text-xs"
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.04)' }}>
                <Lock size={12} /> Lock
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-site py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Total',     value: stats.total,     icon: CalendarCheck, color: 'var(--gold)' },
            { label: 'Pending',   value: stats.pending,   icon: Clock,         color: '#D97706' },
            { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2,  color: '#2563EB' },
            { label: 'Completed', value: stats.completed, icon: Users,         color: '#16A34A' },
            { label: 'Unread Msgs',value: stats.unread,   icon: Mail,          color: '#DC2626' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card-luxury p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono-dm text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
                <Icon size={14} style={{ color }} />
              </div>
              <p className="font-display font-medium text-3xl" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-7">
          {[
            { id: 'appointments' as Tab, label: 'Appointments', icon: LayoutDashboard, badge: filtered.length },
            { id: 'messages'     as Tab, label: 'Messages',     icon: MessageSquare,   badge: stats.unread },
          ].map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: tab === id ? 'var(--gold)' : 'var(--bg-surface)',
                color:      tab === id ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${tab === id ? 'var(--gold)' : 'var(--border)'}`,
              }}>
              <Icon size={13} />
              {label}
              {badge > 0 && (
                <span className="px-1.5 py-0.5 rounded text-xs font-bold"
                  style={{
                    background: tab === id ? 'rgba(255,255,255,0.25)' : 'var(--gold-pale)',
                    color:      tab === id ? '#fff' : 'var(--gold)',
                  }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Appointments ── */}
        {tab === 'appointments' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-48">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-faint)' }} />
                <input type="text" placeholder="Search by name or issue…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="input-luxury pl-9 py-2 text-sm" />
              </div>
              <div className="relative">
                <select value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                  className="input-luxury py-2 text-sm pr-9 appearance-none cursor-pointer min-w-[160px]">
                  <option value="all">All Status</option>
                  {(['pending','confirmed','completed','cancelled'] as AppStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-faint)' }} />
              </div>
              <button onClick={exportCSV} className="btn-ghost text-xs">
                <Download size={13} /> Export CSV
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={26} className="animate-spin" style={{ color: 'var(--gold)' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="card-luxury p-14 text-center">
                <CalendarCheck size={28} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                <p className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>No appointments found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div className="card-luxury overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}>
                        {['#','Client','Age','Issue','Status','Date','Submitted',''].map(h => (
                          <th key={h}
                            className="text-left px-5 py-3.5 font-mono-dm text-xs tracking-widest uppercase"
                            style={{ color: 'var(--text-faint)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((appt, i) => (
                        <tr key={appt.id}
                          className="tr-hover transition-colors"
                          style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-5 py-4 font-mono-dm text-xs" style={{ color: 'var(--text-faint)' }}>
                            {i + 1}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                              {appt.first_name} {appt.last_name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                              {appt.address}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                            {appt.age}
                          </td>
                          <td className="px-5 py-4 max-w-[180px]">
                            <p className="text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>
                              {appt.issue_type}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={STATUS_CLASS[appt.status]}>
                              {STATUS_LABEL[appt.status]}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono-dm text-xs" style={{ color: 'var(--text-muted)' }}>
                            {appt.appointment_date
                              ? format(new Date(appt.appointment_date), 'MMM d, yyyy') : '—'}
                          </td>
                          <td className="px-5 py-4 font-mono-dm text-xs" style={{ color: 'var(--text-muted)' }}>
                            {appt.created_at ? format(new Date(appt.created_at), 'MMM d') : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => {
                                setSelected(appt)
                                setNotes(appt.notes || '')
                                setDateVal(appt.appointment_date || '')
                              }}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all"
                              style={{
                                background: 'var(--gold-pale)',
                                color: 'var(--gold)',
                                border: '1px solid var(--gold-border)',
                              }}>
                              <Eye size={11} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Messages ── */}
        {tab === 'messages' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={26} className="animate-spin" style={{ color: 'var(--gold)' }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="card-luxury p-14 text-center">
                <Mail size={28} className="mx-auto mb-3" style={{ color: 'var(--text-faint)' }} />
                <p className="font-display text-lg" style={{ color: 'var(--text-primary)' }}>No messages yet</p>
              </div>
            ) : messages.map(msg => (
              <div key={msg.id}
                className="card-luxury p-5 cursor-pointer transition-all"
                style={{ borderLeft: !msg.read ? '2px solid var(--gold)' : '2px solid transparent' }}
                onClick={() => { setSelectedMsg(msg); if (!msg.read) markRead(msg.id!) }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{msg.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{msg.email}</p>
                      {!msg.read && (
                        <span className="badge badge-confirmed" style={{ fontSize: '0.55rem' }}>New</span>
                      )}
                    </div>
                    <p className="font-medium text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {msg.subject}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{msg.message}</p>
                  </div>
                  <p className="font-mono-dm text-xs flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                    {msg.created_at ? format(new Date(msg.created_at), 'MMM d') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Appointment Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="card-luxury w-full max-w-lg max-h-[90vh] overflow-y-auto"
            style={{ border: '1px solid var(--border-strong)' }}>
            <div className="sticky top-0 flex items-center justify-between px-7 py-5 border-b"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <div>
                <p className="font-display font-medium text-lg" style={{ color: 'var(--text-primary)' }}>
                  Appointment Details
                </p>
                <p className="font-mono-dm text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  ID: {selected.id?.slice(0, 8)}…
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-6">
              {/* Client info */}
              <div className="grid grid-cols-2 gap-4">
                {([
                  ['Full Name', `${selected.first_name} ${selected.last_name}`, false],
                  ['Age', String(selected.age), false],
                  ['Address', selected.address, true],
                  ['Issue Type', selected.issue_type, true],
                ] as [string, string, boolean][]).map(([label, val, full]) => (
                  <div key={label} className={full ? 'col-span-2' : ''}>
                    <p className="label-lux mb-1">{label}</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{val}</p>
                  </div>
                ))}
                {selected.description && (
                  <div className="col-span-2">
                    <p className="label-lux mb-1">Description</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selected.description}</p>
                  </div>
                )}
              </div>

              <div className="rule-gold" />

              {/* Status */}
              <div>
                <p className="label-lux mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['pending','confirmed','completed','cancelled'] as AppStatus[]).map(s => (
                    <button key={s}
                      disabled={!!updatingId}
                      onClick={() => updateStatus(selected.id!, s)}
                      className={`${STATUS_CLASS[s]} cursor-pointer transition-all ${
                        selected.status === s ? 'ring-2 ring-offset-1 ring-yellow-400' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ fontSize: '0.65rem', padding: '0.3rem 0.75rem' }}>
                      {updatingId === selected.id
                        ? <Loader2 size={10} className="animate-spin" />
                        : STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="label-lux mb-2">Set Appointment Date</p>
                <div className="flex gap-2">
                  <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)}
                    className="input-luxury py-2 text-sm flex-1" />
                  <button onClick={() => setDate(selected.id!)} disabled={!dateVal}
                    className="btn-gold py-2 px-4 text-xs disabled:opacity-40">
                    Save
                  </button>
                </div>
                {selected.appointment_date && (
                  <p className="font-mono-dm text-xs mt-1.5" style={{ color: 'var(--text-faint)' }}>
                    Current: {format(new Date(selected.appointment_date), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <p className="label-lux mb-2">Secretary Notes</p>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Internal notes (admin-only)…"
                  className="input-luxury text-sm resize-none" />
                <button onClick={() => saveNotes(selected.id!)} className="btn-outline text-xs py-2 px-4 mt-2">
                  Save Notes
                </button>
              </div>

              <p className="font-mono-dm text-xs" style={{ color: 'var(--text-faint)' }}>
                Submitted:{' '}
                {selected.created_at ? format(new Date(selected.created_at), 'MMMM d, yyyy · h:mm a') : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Message Modal ── */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedMsg(null) }}>
          <div className="card-luxury w-full max-w-lg" style={{ border: '1px solid var(--border-strong)' }}>
            <div className="flex items-center justify-between px-7 py-5 border-b"
              style={{ borderColor: 'var(--border)' }}>
              <p className="font-display font-medium text-lg" style={{ color: 'var(--text-primary)' }}>
                Message
              </p>
              <button onClick={() => setSelectedMsg(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="px-7 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label-lux mb-1">From</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedMsg.name}</p>
                </div>
                <div>
                  <p className="label-lux mb-1">Email</p>
                  <a href={`mailto:${selectedMsg.email}`}
                    className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
                    {selectedMsg.email}
                  </a>
                </div>
                <div className="col-span-2">
                  <p className="label-lux mb-1">Subject</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedMsg.subject}</p>
                </div>
                <div className="col-span-2">
                  <p className="label-lux mb-2">Message</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap p-4 rounded-lg"
                    style={{ color: 'var(--text-secondary)', background: 'var(--bg-raised)' }}>
                    {selectedMsg.message}
                  </p>
                </div>
              </div>
              <div className="rule-gold" />
              <p className="font-mono-dm text-xs" style={{ color: 'var(--text-faint)' }}>
                Received: {selectedMsg.created_at
                  ? format(new Date(selectedMsg.created_at), 'MMMM d, yyyy · h:mm a') : ''}
              </p>
              <a href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                className="btn-gold w-full justify-center text-xs py-3">
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
   ROOT EXPORT — Auth gate
══════════════════════════════════════ */
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking,      setChecking]      = useState(true)

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem(SESSION_KEY) === '1')
    setChecking(false)
  }, [])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-canvas)' }}>
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--gold)' }} />
    </div>
  )

  return authenticated
    ? <AdminDashboard />
    : <PinScreen onSuccess={() => setAuthenticated(true)} />
}
