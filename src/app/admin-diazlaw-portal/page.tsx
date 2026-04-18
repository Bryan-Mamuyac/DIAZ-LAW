'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, Appointment, ContactMessage } from '@/lib/supabase'
import { STATUS_COLORS } from '@/lib/constants'
import {
  CalendarCheck, Mail, Users, Clock, CheckCircle2,
  Eye, ChevronDown, RefreshCw, LayoutDashboard, MessageSquare,
  Search, Download, Scale, Loader2, X, ChevronRight, Lock, Delete,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

/* ─────────────────────────────────────────
   PIN LOCK SCREEN
───────────────────────────────────────── */
const ADMIN_PIN = '121212'
const SESSION_KEY = 'diazlaw_admin_auth'

function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (locked && lockTimer > 0) {
      timerRef.current = setTimeout(() => setLockTimer(t => t - 1), 1000)
    } else if (locked && lockTimer === 0 && attempts > 0) {
      setLocked(false)
      setAttempts(0)
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
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      if (newAttempts >= 3) {
        setLocked(true)
        setLockTimer(30)
        toast.error('Too many attempts. Locked for 30 seconds.')
      } else {
        toast.error(`Incorrect PIN. ${3 - newAttempts} attempt(s) left.`)
      }
    }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','del']

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}>
      <style>{`
        @keyframes pinShake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-10px)}
          40%{transform:translateX(10px)}
          60%{transform:translateX(-7px)}
          80%{transform:translateX(7px)}
        }
        .pin-shake { animation: pinShake 0.5s ease; }
      `}</style>

      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--navy-accent)' }}>
            <Scale size={28} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            DIAZ LAW
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Admin Portal</p>
        </div>

        {/* PIN Card */}
        <div className="card p-7">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Lock size={14} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
              Enter Admin PIN
            </p>
          </div>

          {locked && (
            <p className="text-center text-xs text-red-500 mt-2 font-semibold animate-pulse">
              Too many attempts — retry in {lockTimer}s
            </p>
          )}

          {/* PIN Dots */}
          <div className={`flex items-center justify-center gap-3 my-6 ${shake ? 'pin-shake' : ''}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}
                className="w-4 h-4 rounded-full border-2 transition-all duration-150"
                style={{
                  backgroundColor: i < pin.length ? 'var(--navy-accent)' : 'transparent',
                  borderColor: i < pin.length ? 'var(--navy-accent)' : 'var(--border)',
                  transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
                }} />
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2.5">
            {keys.map((key, idx) => {
              if (key === '') return <div key={idx} />
              const isDel = key === 'del'
              return (
                <button key={idx}
                  onClick={() => handleKey(key)}
                  disabled={locked || (!isDel && pin.length >= 6)}
                  className="h-14 rounded-xl font-bold text-lg flex items-center justify-center
                             transition-all duration-100 active:scale-90 disabled:opacity-40 select-none"
                  style={{
                    backgroundColor: isDel ? 'rgba(220,38,38,0.08)' : 'var(--bg-primary)',
                    color: isDel ? '#ef4444' : 'var(--text-primary)',
                    border: '1.5px solid var(--border)',
                  }}
                  onMouseDown={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      isDel ? 'rgba(220,38,38,0.18)' : 'var(--bg-secondary)'
                  }}
                  onMouseUp={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      isDel ? 'rgba(220,38,38,0.08)' : 'var(--bg-primary)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      isDel ? 'rgba(220,38,38,0.08)' : 'var(--bg-primary)'
                  }}>
                  {isDel ? <Delete size={18} /> : key}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-center mt-5" style={{ color: 'var(--text-muted)' }}>
            Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   ADMIN DASHBOARD
───────────────────────────────────────── */
type Tab = 'appointments' | 'messages'
type StatusFilter = 'all' | Appointment['status']

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('appointments')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<string>('')
  const [notes, setNotes] = useState('')

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

  const updateStatus = async (id: string, status: Appointment['status']) => {
    setUpdatingId(id)
    const { error } = await supabase
      .from('appointments').update({ status, notes: notes || undefined }).eq('id', id)
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
      toast.success(`Status updated to ${status}`)
    } else {
      toast.error('Update failed. Try again.')
    }
    setUpdatingId(null)
  }

  const setAppointmentDate = async (id: string, date: string) => {
    const { error } = await supabase
      .from('appointments').update({ appointment_date: date }).eq('id', id)
    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, appointment_date: date } : a))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, appointment_date: date } : null)
      toast.success('Appointment date set!')
    }
  }

  const markMessageRead = async (id: string) => {
    await supabase.from('contact_messages').update({ read: true }).eq('id', id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m))
  }

  const filteredAppts = appointments.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    const matchSearch = !search ||
      `${a.first_name} ${a.last_name} ${a.issue_type}`
        .toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    unreadMsgs: messages.filter(m => !m.read).length,
  }

  const exportCSV = () => {
    const headers = ['ID','First Name','Last Name','Age','Address','Issue','Status','Date','Submitted']
    const rows = filteredAppts.map(a => [
      a.id, a.first_name, a.last_name, a.age, `"${a.address}"`,
      `"${a.issue_type}"`, a.status,
      a.appointment_date || 'Not set',
      format(new Date(a.created_at!), 'MMM d, yyyy HH:mm'),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'appointments.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY)
    window.location.reload()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="border-b sticky top-0 z-40"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="section-container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--navy-accent)' }}>
                <Scale size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                DIAZ LAW
              </span>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
                Admin Dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAll}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button onClick={handleLock}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all"
                style={{
                  borderColor: 'rgba(220,38,38,0.3)',
                  color: '#ef4444',
                  backgroundColor: 'rgba(220,38,38,0.06)',
                }}>
                <Lock size={13} /> Lock
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-container py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Appointments', value: stats.total, icon: CalendarCheck, color: '#0e44b8' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: '#d97706' },
            { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: '#2563eb' },
            { label: 'Completed', value: stats.completed, icon: Users, color: '#16a34a' },
            { label: 'Unread Messages', value: stats.unreadMsgs, icon: Mail, color: '#dc2626' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="text-2xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'appointments' as Tab, label: 'Appointments', icon: LayoutDashboard, count: filteredAppts.length },
            { id: 'messages' as Tab, label: 'Messages', icon: MessageSquare, count: stats.unreadMsgs },
          ].map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: tab === id ? 'var(--navy-accent)' : 'var(--bg-card)',
                color: tab === id ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${tab === id ? 'var(--navy-accent)' : 'var(--border)'}`,
              }}>
              <Icon size={15} />
              {label}
              {count > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: tab === id ? 'rgba(255,255,255,0.2)' : 'rgba(14,68,184,0.1)',
                    color: tab === id ? '#fff' : 'var(--navy-accent)',
                  }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Appointments Tab ── */}
        {tab === 'appointments' && (
          <>
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search by name or issue..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="input-field pl-9 py-2 text-sm" />
              </div>
              <div className="relative">
                <select value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                  className="input-field py-2 text-sm pr-8 appearance-none cursor-pointer">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }} />
              </div>
              <button onClick={exportCSV}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)' }}>
                <Download size={14} /> Export CSV
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--navy-accent)' }} />
              </div>
            ) : filteredAppts.length === 0 ? (
              <div className="card p-12 text-center">
                <CalendarCheck size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No appointments found</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-primary)' }}>
                        {['#','Client','Age','Issue Type','Status','Appt. Date','Submitted','Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-semibold text-xs tracking-wide"
                            style={{ color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppts.map((appt, i) => (
                        <tr key={appt.id} className="transition-colors"
                          style={{ borderBottom: '1px solid var(--border)' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {appt.first_name} {appt.last_name}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{appt.address}</p>
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{appt.age}</td>
                          <td className="px-4 py-3 max-w-xs">
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{appt.issue_type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[appt.status]}`}>
                              {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {appt.appointment_date
                              ? format(new Date(appt.appointment_date), 'MMM d, yyyy') : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {appt.created_at ? format(new Date(appt.created_at), 'MMM d, yyyy') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelected(appt)
                                setNotes(appt.notes || '')
                                setDateFilter(appt.appointment_date || '')
                              }}
                              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                              style={{ backgroundColor: 'rgba(14,68,184,0.1)', color: 'var(--navy-accent)' }}>
                              <Eye size={12} /> View
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

        {/* ── Messages Tab ── */}
        {tab === 'messages' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--navy-accent)' }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="card p-12 text-center">
                <Mail size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No messages yet</p>
              </div>
            ) : messages.map(msg => (
              <div key={msg.id}
                className="card p-5 cursor-pointer hover:shadow-md transition-all"
                style={{ borderLeft: !msg.read ? '3px solid var(--navy-accent)' : '3px solid transparent' }}
                onClick={() => { setSelectedMsg(msg); if (!msg.read) markMessageRead(msg.id!) }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{msg.name}</p>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>&lt;{msg.email}&gt;</span>
                      {!msg.read && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(14,68,184,0.1)', color: 'var(--navy-accent)' }}>
                          New
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {msg.subject}
                    </p>
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{msg.message}</p>
                  </div>
                  <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {msg.created_at ? format(new Date(msg.created_at), 'MMM d, yyyy') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Appointment Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-5 border-b"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
              <h3 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Appointment Details
              </h3>
              <button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['Full Name', `${selected.first_name} ${selected.last_name}`],
                  ['Age', String(selected.age)],
                  ['Address', selected.address],
                  ['Issue Type', selected.issue_type],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className={label === 'Address' || label === 'Issue Type' ? 'col-span-2' : ''}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
                {selected.description && (
                  <div className="col-span-2">
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Description</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selected.description}</p>
                  </div>
                )}
              </div>

              <div className="gold-divider" />

              {/* Status update */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['pending','confirmed','completed','cancelled'] as Appointment['status'][]).map(s => (
                    <button key={s}
                      disabled={updatingId === selected.id}
                      onClick={() => updateStatus(selected.id!, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        selected.status === s ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                      } ${STATUS_COLORS[s]}`}>
                      {updatingId === selected.id
                        ? <Loader2 size={12} className="animate-spin inline" />
                        : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Set Appointment Date */}
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Set Appointment Date
                </p>
                <div className="flex gap-2">
                  <input type="date" value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="input-field py-2 text-sm flex-1" />
                  <button onClick={() => setAppointmentDate(selected.id!, dateFilter)}
                    disabled={!dateFilter}
                    className="btn-primary py-2 px-4 text-sm disabled:opacity-50">Set</button>
                </div>
                {selected.appointment_date && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Current: {format(new Date(selected.appointment_date), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Secretary Notes
                </p>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Add internal notes (admin-only)..."
                  className="input-field text-sm resize-none" />
                <button
                  onClick={async () => {
                    await supabase.from('appointments').update({ notes }).eq('id', selected.id)
                    toast.success('Notes saved!')
                  }}
                  className="btn-primary text-xs py-1.5 px-4 mt-2">
                  Save Notes
                </button>
              </div>

              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Submitted:{' '}
                {selected.created_at
                  ? format(new Date(selected.created_at), 'MMMM d, yyyy — h:mm a') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Message Detail Modal ── */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedMsg(null) }}>
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b"
              style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Message
              </h3>
              <button onClick={() => setSelectedMsg(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>From</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedMsg.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Email</p>
                  <a href={`mailto:${selectedMsg.email}`} className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--navy-accent)' }}>{selectedMsg.email}</a>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Subject</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedMsg.subject}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Message</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: 'var(--text-secondary)' }}>{selectedMsg.message}</p>
                </div>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Received:{' '}
                {selectedMsg.created_at
                  ? format(new Date(selectedMsg.created_at), 'MMMM d, yyyy — h:mm a') : ''}
              </p>
              <a href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                className="btn-primary flex items-center justify-center gap-2 text-sm py-3">
                <Mail size={15} /> Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   ROOT EXPORT — Auth gate
───────────────────────────────────────── */
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const auth = sessionStorage.getItem(SESSION_KEY)
    setAuthenticated(auth === '1')
    setChecking(false)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--navy-accent)' }} />
      </div>
    )
  }

  if (!authenticated) {
    return <PinScreen onSuccess={() => setAuthenticated(true)} />
  }

  return <AdminDashboard />
}
