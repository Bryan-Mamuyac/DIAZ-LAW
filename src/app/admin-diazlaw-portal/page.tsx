'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase, Appointment, ContactMessage, FinancialRecord } from '@/lib/supabase'
import {
  CalendarCheck, Mail, Users, Clock, CheckCircle2, Eye,
  ChevronDown, RefreshCw, LayoutDashboard, MessageSquare,
  Search, Download, Loader2, X, Lock, Delete, Scale,
  LogOut, Sun, Moon, TrendingUp, TrendingDown, DollarSign,
  Plus, AlertTriangle, Trash2, BarChart2, Calendar, Filter,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

/* ─────────── CONSTANTS ─────────── */
const ADMIN_PIN    = '121212'
const SESSION_KEY  = 'diazlaw_admin_auth'
const THEME_KEY    = 'diazlaw-theme'
const MAX_ATTEMPTS = 5
const LOCK_SECS    = 180

const REVENUE_CATS = ['Consultation Fee','Notarial Fee','Legal Representation','Document Drafting','Other Revenue']
const EXPENSE_CATS = ['Office Supplies','Utilities','Rent','Transportation','Miscellaneous Expense']
const PAY_METHODS  = ['Cash','GCash','Bank Transfer','Check','Other']

/* ─────────── FONTS ─────────── */
// Use Inter for numbers and DM Sans for body — clear, readable
const F_BODY   = "'Inter', 'DM Sans', sans-serif"
const F_NUM    = "'Inter', 'DM Sans', sans-serif"
const F_MONO   = "'DM Mono', 'Courier New', monospace"
const F_SERIF  = "'Cormorant Garamond', Georgia, serif"

/* ─────────── STATUS ─────────── */
type AppStatus = Appointment['status']
const SL: Record<AppStatus,string> = { pending:'Pending', confirmed:'Confirmed', completed:'Completed', cancelled:'Cancelled' }
const SS: Record<AppStatus,{bg:string;color:string;border:string}> = {
  pending:   {bg:'rgba(234,179,8,0.12)',  color:'#B45309', border:'rgba(234,179,8,0.3)'},
  confirmed: {bg:'rgba(59,130,246,0.1)',  color:'#1D4ED8', border:'rgba(59,130,246,0.25)'},
  completed: {bg:'rgba(34,197,94,0.1)',   color:'#15803D', border:'rgba(34,197,94,0.25)'},
  cancelled: {bg:'rgba(239,68,68,0.1)',   color:'#B91C1C', border:'rgba(239,68,68,0.25)'},
}
function Badge({ s }: { s: AppStatus }) {
  const st = SS[s]
  return (
    <span style={{
      background:st.bg, color:st.color, border:`1px solid ${st.border}`,
      padding:'0.25rem 0.75rem', borderRadius:'5px',
      fontFamily:F_MONO, fontSize:'0.68rem',
      fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase',
    }}>{SL[s]}</span>
  )
}

/* ─────────── HELPERS ─────────── */
function todayISO() { return new Date().toISOString().slice(0,10) }

function formatDateDisplay(iso: string) {
  if (!iso) return ''
  try { return format(parseISO(iso), 'EEEE, MMMM d, yyyy') } catch { return iso }
}

/** Generate INV-YYYY-NNN based on count */
function generateInvoice(count: number): string {
  const yr  = new Date().getFullYear()
  const seq = String(count + 1).padStart(3, '0')
  return `INV-${yr}-${seq}`
}

/* ─────────── THEME HOOK ─────────── */
function useAdminTheme() {
  const [isDark,  setIsDark]  = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const dark = localStorage.getItem(THEME_KEY) === 'dark'
    setIsDark(dark)
    apply(dark)
  }, [])

  function apply(dark: boolean) {
    document.documentElement.classList.remove('dark','light')
    document.documentElement.classList.add(dark ? 'dark' : 'light')
  }
  function toggle() {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    apply(next)
  }
  return { isDark, toggle, mounted }
}

/* ─────────── ICON BUTTON ─────────── */
function IconBtn({ icon, label, onClick, danger=false }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
        padding:'0.375rem 0.625rem', borderRadius:'8px', cursor:'pointer', border:'none',
        background: danger ? (hov?'rgba(239,68,68,0.22)':'rgba(239,68,68,0.1)') : (hov?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.06)'),
        transition:'background 0.2s', minWidth:'48px',
      }}>
      <span style={{color: danger?'#fca5a5':'rgba(237,232,222,0.75)', display:'flex'}}>{icon}</span>
      <span style={{fontFamily:F_MONO, fontSize:'0.52rem', letterSpacing:'0.12em', textTransform:'uppercase', color: danger?'rgba(252,165,165,0.75)':'rgba(201,168,76,0.7)', lineHeight:1, whiteSpace:'nowrap'}}>{label}</span>
    </button>
  )
}

/* ══════════════════════════════════
   PIN SCREEN
══════════════════════════════════ */
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin,      setPin]      = useState('')
  const [shake,    setShake]    = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked,   setLocked]   = useState(false)
  const [timer,    setTimer]    = useState(0)
  const { isDark, toggle, mounted } = useAdminTheme()
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (locked && timer > 0) { timerRef.current = setTimeout(() => setTimer(t=>t-1), 1000) }
    else if (locked && timer===0 && attempts>0) { setLocked(false); setAttempts(0); setPin('') }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [locked, timer, attempts])

  const checkPin = useCallback((p: string) => {
    if (p === ADMIN_PIN) { sessionStorage.setItem(SESSION_KEY,'1'); onSuccess(); return }
    setShake(true); setTimeout(() => { setShake(false); setPin('') }, 550)
    const n = attempts+1; setAttempts(n)
    if (n>=MAX_ATTEMPTS) { setLocked(true); setTimer(LOCK_SECS); toast.error(`Locked for ${LOCK_SECS/60} minutes.`) }
    else toast.error(`Wrong PIN — ${MAX_ATTEMPTS-n} attempt${MAX_ATTEMPTS-n!==1?'s':''} left`)
  }, [attempts, onSuccess])

  const handleKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return
    const raw = e.target.value.replace(/\D/g,'').slice(0,6)
    setPin(raw); if (raw.length===6) { e.target.value=''; checkPin(raw) }
  }
  const numpad = (k: string) => {
    if (locked) return
    if (k==='del') { setPin(p=>p.slice(0,-1)); return }
    if (pin.length>=6) return
    const next = pin+k; setPin(next)
    if (next.length===6) checkPin(next)
    inputRef.current?.focus()
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del']
  const mins = Math.floor(timer/60); const secs = timer%60

  const bg   = isDark ? '#07090F' : '#F7F5F0'
  const card = isDark ? '#0C1120' : '#FFFFFF'
  const brd  = isDark ? 'rgba(201,168,76,0.2)' : 'rgba(184,146,42,0.22)'
  const txt  = isDark ? '#EDE8DE' : '#0A1628'
  const sub  = isDark ? '#94A3B8' : '#6B7280'

  return (
    <div style={{minHeight:'100vh', background:bg, display:'flex', flexDirection:'column'}}
      onClick={() => inputRef.current?.focus()}>
      <style>{`@keyframes pinShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}.pin-shake{animation:pinShake 0.5s ease;}`}</style>

      {/* Navbar */}
      <header style={{height:'68px', background:'#0A1628', borderBottom:'1px solid rgba(201,168,76,0.18)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2.5rem', flexShrink:0, boxShadow:'0 2px 20px rgba(0,0,0,0.35)'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'36px', height:'36px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.32)'}}>
            <Scale size={17} color="#C9A84C"/>
          </div>
          <div style={{lineHeight:1}}>
            <div style={{fontFamily:F_SERIF, fontWeight:600, fontSize:'1rem', color:'#EDE8DE', letterSpacing:'0.05em'}}>DIAZ LAW OFFICE</div>
            <div style={{fontFamily:F_MONO, fontSize:'0.52rem', letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(201,168,76,0.65)', marginTop:'3px'}}>Admin Portal</div>
          </div>
        </div>
        {mounted && <IconBtn icon={isDark?<Sun size={15}/>:<Moon size={15}/>} label={isDark?'Dark':'Light'} onClick={toggle}/>}
      </header>

      {/* PIN body */}
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem'}}>
        <input ref={inputRef} type="tel" inputMode="numeric" maxLength={6}
          onChange={handleKeyInput} disabled={locked} autoComplete="off"
          style={{position:'absolute', opacity:0, pointerEvents:'none', width:'1px', height:'1px'}}/>
        <div style={{width:'100%', maxWidth:'360px'}}>
          <div style={{textAlign:'center', marginBottom:'2rem'}}>
            <div style={{width:'68px', height:'68px', borderRadius:'20px', margin:'0 auto 1.25rem', display:'flex', alignItems:'center', justifyContent:'center', background:isDark?'rgba(201,168,76,0.12)':'rgba(184,146,42,0.08)', border:`1px solid ${brd}`}}>
              <Lock size={28} color="#C9A84C"/>
            </div>
            <h1 style={{fontFamily:F_BODY, fontWeight:600, fontSize:'1.75rem', color:txt, marginBottom:'0.375rem'}}>Admin Access</h1>
            <p style={{fontFamily:F_MONO, fontSize:'0.65rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(201,168,76,0.65)'}}>Enter PIN to continue</p>
          </div>

          <div style={{background:card, borderRadius:'22px', padding:'2rem 1.75rem', border:`1px solid ${brd}`, boxShadow:isDark?'0 24px 60px rgba(0,0,0,0.5)':'0 12px 40px rgba(10,14,26,0.08)'}}>
            <p style={{textAlign:'center', fontFamily:F_MONO, fontSize:'0.62rem', letterSpacing:'0.1em', color:sub, marginBottom:'0.875rem'}}>⌨ TYPE ON KEYBOARD OR CLICK BELOW</p>

            {locked && (
              <div style={{marginBottom:'1rem', padding:'0.625rem 1rem', borderRadius:'8px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', textAlign:'center'}}>
                <p style={{fontFamily:F_NUM, fontSize:'0.9rem', fontWeight:700, color:'#ef4444'}}>LOCKED — {mins}:{String(secs).padStart(2,'0')}</p>
              </div>
            )}
            {!locked && attempts>0 && (
              <div style={{marginBottom:'1rem', padding:'0.5rem 1rem', borderRadius:'8px', background:'rgba(234,179,8,0.08)', border:'1px solid rgba(234,179,8,0.2)', textAlign:'center'}}>
                <p style={{fontFamily:F_BODY, fontSize:'0.85rem', color:'#fcd34d'}}>{MAX_ATTEMPTS-attempts} attempt{MAX_ATTEMPTS-attempts!==1?'s':''} remaining</p>
              </div>
            )}

            {/* Dots */}
            <div className={shake?'pin-shake':''} style={{display:'flex', justifyContent:'center', gap:'12px', margin:'1.5rem 0'}}>
              {Array.from({length:6}).map((_,i)=>(
                <div key={i} style={{width:'16px', height:'16px', borderRadius:'50%', background:i<pin.length?'#C9A84C':'transparent', border:`2px solid ${i<pin.length?'#C9A84C':brd}`, transition:'all 0.15s', transform:i<pin.length?'scale(1.15)':'scale(1)'}}/>
              ))}
            </div>

            {/* Numpad */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px'}}>
              {KEYS.map((k,idx)=>{
                if(k==='') return <div key={idx}/>
                const isDel=k==='del'
                return (
                  <button key={idx} type="button" onClick={()=>numpad(k)}
                    disabled={locked||(!isDel&&pin.length>=6)}
                    style={{height:'60px', borderRadius:'12px', cursor:'pointer', fontFamily:F_NUM, fontWeight:600, fontSize:'1.3rem', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.1s', background:isDel?'rgba(239,68,68,0.08)':(isDark?'rgba(255,255,255,0.05)':'rgba(10,14,26,0.04)'), color:isDel?'#ef4444':txt, border:`1px solid ${isDel?'rgba(239,68,68,0.2)':(isDark?'rgba(237,232,222,0.1)':'rgba(10,14,26,0.1)')}`, opacity:locked?0.3:1}}
                    onMouseDown={e=>{(e.currentTarget as HTMLButtonElement).style.background=isDel?'rgba(239,68,68,0.2)':'rgba(201,168,76,0.15)'}}
                    onMouseUp={e=>{(e.currentTarget as HTMLButtonElement).style.background=isDel?'rgba(239,68,68,0.08)':(isDark?'rgba(255,255,255,0.05)':'rgba(10,14,26,0.04)')}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=isDel?'rgba(239,68,68,0.08)':(isDark?'rgba(255,255,255,0.05)':'rgba(10,14,26,0.04)')}}
                  >
                    {isDel?<Delete size={18}/>:k}
                  </button>
                )
              })}
            </div>
            <p style={{textAlign:'center', fontFamily:F_MONO, fontSize:'0.58rem', color:isDark?'rgba(237,232,222,0.2)':'#D1D5DB', marginTop:'1.25rem', letterSpacing:'0.1em'}}>AUTHORIZED PERSONNEL ONLY</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */
type MainTab = 'appointments'|'financial'

function AdminDashboard({ onLock }: { onLock: () => void }) {
  const [tab,        setTab]        = useState<MainTab>('appointments')
  const [msgTab,     setMsgTab]     = useState(false)
  const [appts,      setAppts]      = useState<Appointment[]>([])
  const [msgs,       setMsgs]       = useState<ContactMessage[]>([])
  const [records,    setRecords]    = useState<FinancialRecord[]>([])
  const [loading,    setLoading]    = useState(true)
  const [sFilter,    setSFilter]    = useState<'all'|AppStatus>('all')
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState<Appointment|null>(null)
  const [selMsg,     setSelMsg]     = useState<ContactMessage|null>(null)
  const [updating,   setUpdating]   = useState<string|null>(null)
  const [dateVal,    setDateVal]    = useState('')
  const [notes,      setNotes]      = useState('')
  const { isDark, toggle, mounted } = useAdminTheme()

  // Financial filters
  const [finTypeFilter,  setFinTypeFilter]  = useState<'all'|'revenue'|'expense'>('all')
  const [finMonthFilter, setFinMonthFilter] = useState<string>('all')

  // Financial form — auto today + auto invoice
  const [finForm, setFinForm] = useState({
    record_date: todayISO(), type: 'revenue' as 'revenue'|'expense',
    category: '', amount: '', description: '',
    invoice_number: '', client_name: '', client_issue: '', payment_method: 'Cash',
  })
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [finLoading,   setFinLoading]   = useState(false)
  const [clientMode,   setClientMode]   = useState<'dropdown'|'manual'>('dropdown')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: a }, { data: m }, { data: r }] = await Promise.all([
      supabase.from('appointments').select('*').order('created_at',{ascending:false}),
      supabase.from('contact_messages').select('*').order('created_at',{ascending:false}),
      supabase.from('financial_records').select('*').order('record_date',{ascending:false}),
    ])
    setAppts((a as Appointment[])||[])
    setMsgs((m as ContactMessage[])||[])
    const recs = (r as FinancialRecord[])||[]
    setRecords(recs)
    // Auto-generate invoice number based on existing count
    const nextInv = generateInvoice(recs.length)
    setFinForm(p => ({ ...p, invoice_number: nextInv }))
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Completed appointments for client dropdown
  const completedAppts = useMemo(
    () => appts.filter(a => a.status === 'completed'),
    [appts]
  )

  const filtered    = appts.filter(a => (sFilter==='all'||a.status===sFilter) && (!search||`${a.first_name} ${a.last_name} ${a.issue_type}`.toLowerCase().includes(search.toLowerCase())))
  const unreadMsgs  = msgs.filter(m=>!m.read).length
  const newAppts    = appts.filter(a=>a.status==='pending').length
  const totalBadge  = newAppts + unreadMsgs

  const stats = {
    total:     appts.length,
    pending:   newAppts,
    confirmed: appts.filter(a=>a.status==='confirmed').length,
    completed: appts.filter(a=>a.status==='completed').length,
  }

  // Financial
  const totalRevenue = records.filter(r=>r.type==='revenue').reduce((s,r)=>s+r.amount,0)
  const totalExpense = records.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0)
  const netIncome    = totalRevenue - totalExpense

  // Filtered financial records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const typeOk  = finTypeFilter==='all' || r.type===finTypeFilter
      const monthOk = finMonthFilter==='all' || r.record_date.slice(0,7)===finMonthFilter
      return typeOk && monthOk
    })
  }, [records, finTypeFilter, finMonthFilter])

  // Month options from records
  const monthOptions = useMemo(() => {
    const seen = new Set<string>()
    records.forEach(r => seen.add(r.record_date.slice(0,7)))
    return Array.from(seen).sort().reverse()
  }, [records])

  // Chart data — group by yyyy-MM for correctness
  const chartData = useMemo(() => {
    const months: Record<string,{month:string;revenue:number;expense:number}> = {}
    records.forEach(r => {
      const key = r.record_date.slice(0,7) // "2026-04"
      const m   = format(parseISO(r.record_date.slice(0,7)+'-01'), "MMM ''yy")
      if (!months[key]) months[key] = {month:m, revenue:0, expense:0}
      if (r.type==='revenue') months[key].revenue += r.amount
      else months[key].expense += r.amount
    })
    return Object.entries(months).sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v).slice(-8)
  }, [records])

  // Actions
  const updateStatus = async (id:string, status:AppStatus) => {
    setUpdating(id)
    await supabase.from('appointments').update({status, notes:notes||undefined}).eq('id',id)
    setAppts(p=>p.map(a=>a.id===id?{...a,status}:a))
    if (selected?.id===id) setSelected(p=>p?{...p,status}:null)
    toast.success(`Status → ${SL[status]}`); setUpdating(null)
  }
  const setApptDate = async (id:string) => {
    if (!dateVal) return
    await supabase.from('appointments').update({appointment_date:dateVal}).eq('id',id)
    setAppts(p=>p.map(a=>a.id===id?{...a,appointment_date:dateVal}:a))
    if (selected?.id===id) setSelected(p=>p?{...p,appointment_date:dateVal}:null)
    toast.success('Date confirmed!')
  }
  const saveNotes = async (id:string) => {
    await supabase.from('appointments').update({notes}).eq('id',id)
    toast.success('Notes saved.')
  }
  const markRead = async (id:string) => {
    await supabase.from('contact_messages').update({read:true}).eq('id',id)
    setMsgs(p=>p.map(m=>m.id===id?{...m,read:true}:m))
  }
  const deleteMsg = async (id:string) => {
    if (!confirm('Delete this message permanently?')) return
    // Optimistic update first
    setMsgs(p=>p.filter(m=>m.id!==id))
    if (selMsg?.id===id) setSelMsg(null)
    const { error } = await supabase.from('contact_messages').delete().eq('id',id)
    if (error) {
      toast.error('Delete failed — check Supabase RLS policy.')
      fetchAll() // revert on error
    } else {
      toast.success('Message deleted.')
    }
  }
  const saveFinancial = async () => {
    setFinLoading(true)
    const rec = {
      record_date:    finForm.record_date,
      type:           finForm.type,
      category:       finForm.category,
      amount:         parseFloat(finForm.amount),
      description:    finForm.description,
      invoice_number: finForm.invoice_number||null,
      client_name:    finForm.type==='revenue'?(finForm.client_name||null):null,
      client_issue:   finForm.type==='revenue'?(finForm.client_issue||null):null,
      payment_method: finForm.payment_method,
    }
    const { error } = await supabase.from('financial_records').insert([rec])
    if (!error) {
      toast.success('Record saved!')
      const nextCount = records.length + 1
      setFinForm({ record_date:todayISO(), type:'revenue', category:'', amount:'', description:'', invoice_number:generateInvoice(nextCount), client_name:'', client_issue:'', payment_method:'Cash' })
      setShowConfirm(false)
      fetchAll()
    } else { toast.error('Failed to save.') }
    setFinLoading(false)
  }

  const exportApptCSV = () => {
    const h = ['ID','First','Last','Email','Contact','Address','Issue','Status','Appt Date','Appt Time','Submitted']
    const r = filtered.map((a:Appointment)=>[a.id,a.first_name,a.last_name,(a as Record<string,unknown>).email||'',(a as Record<string,unknown>).contact_number||'',`"${a.address}"`,`"${a.issue_type}"`,a.status,a.appointment_date||'',(a as Record<string,unknown>).appointment_time||'',format(new Date(a.created_at!),'MMM d yyyy HH:mm')])
    dl([h,...r],'appointments.csv')
  }
  const exportFinCSV = () => {
    const h = ['Date','Type','Category','Amount','Invoice','Client','Issue','Payment','Description']
    const r = filteredRecords.map(rec=>{const x=rec as Record<string,unknown>; return [rec.record_date,rec.type,rec.category,rec.amount,x.invoice_number||'',x.client_name||'',x.client_issue||'',x.payment_method||'',`"${rec.description}"`]})
    dl([h,...r],'financial_records.csv')
  }
  const dl = (rows:unknown[][],name:string) => {
    const csv=rows.map(x=>x.join(',')).join('\n')
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    const el=document.createElement('a');el.href=url;el.download=name;el.click()
    URL.revokeObjectURL(url)
  }

  const fmtPHP = (n:number) => `₱${n.toLocaleString('en-PH',{minimumFractionDigits:2})}`

  // Shared styles
  const CARD: React.CSSProperties = {background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'16px', boxShadow:'var(--shadow-md)'}
  const LBL:  React.CSSProperties = {fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:'0.5rem'}

  if (!mounted) return null

  return (
    <div style={{minHeight:'100vh', background:'var(--bg-canvas)'}}>

      {/* ══ NAVBAR ══ */}
      <header style={{height:'68px', position:'sticky', top:0, zIndex:50, background:'#0A1628', borderBottom:'1px solid rgba(201,168,76,0.2)', boxShadow:'0 2px 20px rgba(0,0,0,0.4)', display:'flex', alignItems:'center'}}>
        <div style={{maxWidth:'1280px', margin:'0 auto', padding:'0 2.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%'}}>
          {/* Brand */}
          <div style={{display:'flex', alignItems:'center', gap:'10px', flexShrink:0}}>
            <div style={{width:'36px', height:'36px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(201,168,76,0.15)', border:'1px solid rgba(201,168,76,0.32)'}}>
              <Scale size={17} color="#C9A84C"/>
            </div>
            <div style={{lineHeight:1}}>
              <div style={{fontFamily:F_SERIF, fontWeight:600, fontSize:'1rem', color:'#EDE8DE', letterSpacing:'0.05em'}}>DIAZ LAW OFFICE</div>
              <div style={{fontFamily:F_MONO, fontSize:'0.52rem', letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(201,168,76,0.65)', marginTop:'3px'}}>Admin Portal</div>
            </div>
          </div>

          {/* Nav tabs */}
          <nav style={{display:'flex', alignItems:'center', gap:'6px'}}>
            <div style={{position:'relative'}}>
              <button onClick={()=>setTab('appointments')} style={{display:'flex', alignItems:'center', gap:'7px', padding:'0.45rem 1.125rem', borderRadius:'8px', cursor:'pointer', fontFamily:F_BODY, fontSize:'0.9rem', fontWeight:500, transition:'all 0.2s', background:tab==='appointments'?'rgba(201,168,76,0.18)':'transparent', color:tab==='appointments'?'#C9A84C':'rgba(237,232,222,0.65)', border:`1px solid ${tab==='appointments'?'rgba(201,168,76,0.32)':'transparent'}`}}>
                <LayoutDashboard size={14}/> Appointments
              </button>
              {totalBadge>0&&<span style={{position:'absolute', top:'-7px', right:'-7px', background:'#ef4444', color:'#fff', borderRadius:'50%', width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F_NUM, fontSize:'0.7rem', fontWeight:700, border:'2px solid #0A1628'}}>{totalBadge}</span>}
            </div>
            <button onClick={()=>setTab('financial')} style={{display:'flex', alignItems:'center', gap:'7px', padding:'0.45rem 1.125rem', borderRadius:'8px', cursor:'pointer', fontFamily:F_BODY, fontSize:'0.9rem', fontWeight:500, transition:'all 0.2s', background:tab==='financial'?'rgba(201,168,76,0.18)':'transparent', color:tab==='financial'?'#C9A84C':'rgba(237,232,222,0.65)', border:`1px solid ${tab==='financial'?'rgba(201,168,76,0.32)':'transparent'}`}}>
              <BarChart2 size={14}/> Financial
            </button>
          </nav>

          {/* Right controls */}
          <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
            <IconBtn icon={<RefreshCw size={15} className={loading?'animate-spin':''}/>} label="Refresh" onClick={fetchAll}/>
            <IconBtn icon={isDark?<Sun size={15}/>:<Moon size={15}/>} label={isDark?'Dark':'Light'} onClick={toggle}/>
            <IconBtn icon={<LogOut size={15}/>} label="Lock" onClick={onLock} danger/>
          </div>
        </div>
      </header>

      {/* ══ PAGE ══ */}
      <div style={{maxWidth:'1280px', margin:'0 auto', padding:'2.25rem 2.5rem'}}>

        {/* ── APPOINTMENTS TAB ── */}
        {tab==='appointments'&&(
          <>
            {/* Stats — 4 cards, no Unread Msgs */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'2rem'}}>
              {[
                {label:'Total',     v:stats.total,     Icon:CalendarCheck, color:'#C9A84C'},
                {label:'Pending',   v:stats.pending,   Icon:Clock,         color:'#D97706'},
                {label:'Confirmed', v:stats.confirmed, Icon:CheckCircle2,  color:'#2563EB'},
                {label:'Completed', v:stats.completed, Icon:Users,         color:'#16A34A'},
              ].map(({label,v,Icon,color})=>(
                <div key={label} style={{...CARD, padding:'1.5rem'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.875rem'}}>
                    <span style={{fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)'}}>{label}</span>
                    <Icon size={16} style={{color}}/>
                  </div>
                  {/* Use Inter/DM Sans for numbers so "0" looks like 0 not O */}
                  <p style={{fontFamily:F_NUM, fontWeight:700, fontSize:'2.5rem', color:'var(--text-primary)', lineHeight:1, letterSpacing:'-0.02em'}}>{v}</p>
                </div>
              ))}
            </div>

            {/* Sub-tabs */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem'}}>
              <div style={{display:'flex', gap:'8px'}}>
                <button onClick={()=>setMsgTab(false)} style={{display:'flex', alignItems:'center', gap:'7px', padding:'0.5rem 1.25rem', borderRadius:'8px', cursor:'pointer', fontFamily:F_BODY, fontSize:'0.9rem', fontWeight:500, background:!msgTab?'var(--gold)':'var(--bg-surface)', color:!msgTab?'#fff':'var(--text-muted)', border:`1px solid ${!msgTab?'var(--gold)':'var(--border)'}`}}>
                  <LayoutDashboard size={13}/> Appointments
                  {newAppts>0&&<span style={{background:!msgTab?'rgba(255,255,255,0.25)':'var(--gold-pale)', color:!msgTab?'#fff':'var(--gold)', borderRadius:'4px', padding:'0.1rem 0.5rem', fontSize:'0.72rem', fontWeight:700}}>{newAppts}</span>}
                </button>
                <button onClick={()=>setMsgTab(true)} style={{display:'flex', alignItems:'center', gap:'7px', padding:'0.5rem 1.25rem', borderRadius:'8px', cursor:'pointer', fontFamily:F_BODY, fontSize:'0.9rem', fontWeight:500, background:msgTab?'var(--gold)':'var(--bg-surface)', color:msgTab?'#fff':'var(--text-muted)', border:`1px solid ${msgTab?'var(--gold)':'var(--border)'}`}}>
                  <MessageSquare size={13}/> Messages
                  {unreadMsgs>0&&<span style={{background:msgTab?'rgba(255,255,255,0.25)':'rgba(220,38,38,0.1)', color:msgTab?'#fff':'#DC2626', borderRadius:'4px', padding:'0.1rem 0.5rem', fontSize:'0.72rem', fontWeight:700}}>{unreadMsgs}</span>}
                </button>
              </div>
            </div>

            {/* Appointments list */}
            {!msgTab&&(
              <>
                <div style={{display:'flex', gap:'10px', marginBottom:'1rem', flexWrap:'wrap'}}>
                  <div style={{position:'relative', flex:1, minWidth:'200px'}}>
                    <Search size={14} style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)'}}/>
                    <input type="text" placeholder="Search by name or issue…" value={search} onChange={e=>setSearch(e.target.value)} className="input-luxury" style={{paddingLeft:'2.5rem', fontSize:'0.95rem', width:'100%'}}/>
                  </div>
                  <div style={{position:'relative'}}>
                    <select value={sFilter} onChange={e=>setSFilter(e.target.value as 'all'|AppStatus)} className="input-luxury" style={{paddingRight:'2.25rem', minWidth:'160px', appearance:'none', cursor:'pointer', fontSize:'0.95rem'}}>
                      <option value="all">All Status</option>
                      {(['pending','confirmed','completed','cancelled'] as AppStatus[]).map(s=><option key={s} value={s}>{SL[s]}</option>)}
                    </select>
                    <ChevronDown size={13} style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                  </div>
                  <button onClick={exportApptCSV} style={{display:'flex', alignItems:'center', gap:'6px', padding:'0.625rem 1.125rem', borderRadius:'10px', fontFamily:F_BODY, fontSize:'0.9rem', fontWeight:500, cursor:'pointer', background:'var(--bg-surface)', border:'1px solid var(--border)', color:'var(--text-secondary)'}}>
                    <Download size={13}/> Export CSV
                  </button>
                </div>

                {loading ? <div style={{display:'flex', justifyContent:'center', padding:'6rem 0'}}><Loader2 size={28} className="animate-spin" style={{color:'var(--gold)'}}/></div>
                : filtered.length===0 ? (
                  <div style={{...CARD, padding:'4rem', textAlign:'center'}}>
                    <CalendarCheck size={32} style={{color:'var(--text-faint)', margin:'0 auto 0.875rem'}}/>
                    <p style={{fontFamily:F_BODY, fontSize:'1.2rem', color:'var(--text-primary)', fontWeight:500}}>No appointments found</p>
                    <p style={{fontSize:'0.95rem', color:'var(--text-muted)', marginTop:'0.25rem'}}>Try adjusting your filters</p>
                  </div>
                ) : (
                  <div style={{...CARD, overflow:'hidden'}}>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%', borderCollapse:'collapse'}}>
                        <thead>
                          <tr style={{background:'var(--bg-raised)', borderBottom:'1px solid var(--border)'}}>
                            {['#','Client','Issue','Status','Pref. Date','Time','Submitted',''].map(h=>(
                              <th key={h} style={{textAlign:'left', padding:'0.875rem 1.125rem', fontFamily:F_MONO, fontSize:'0.65rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-faint)', fontWeight:500, whiteSpace:'nowrap'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((appt,i)=>{
                            const a=appt as Appointment&{appointment_time?:string}
                            return (
                              <tr key={a.id} style={{borderBottom:'1px solid var(--border)', cursor:'pointer'}}
                                onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='var(--bg-raised)'}
                                onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=''}>
                                <td style={{padding:'1rem 1.125rem', color:'var(--text-faint)', fontFamily:F_NUM, fontSize:'0.85rem'}}>{i+1}</td>
                                <td style={{padding:'1rem 1.125rem'}}>
                                  <p style={{fontWeight:600, color:'var(--text-primary)', fontSize:'0.95rem', fontFamily:F_BODY}}>{a.first_name} {a.last_name}</p>
                                  <p style={{fontSize:'0.8rem', color:'var(--text-faint)', marginTop:'2px', fontFamily:F_BODY}}>{(a as Record<string,unknown>).contact_number as string||a.address}</p>
                                </td>
                                <td style={{padding:'1rem 1.125rem', maxWidth:'180px'}}><p style={{fontSize:'0.9rem', color:'var(--text-secondary)', lineHeight:1.4, fontFamily:F_BODY}}>{a.issue_type}</p></td>
                                <td style={{padding:'1rem 1.125rem'}}><Badge s={a.status}/></td>
                                <td style={{padding:'1rem 1.125rem', fontFamily:F_NUM, fontSize:'0.85rem', color:'var(--text-muted)', whiteSpace:'nowrap'}}>{a.appointment_date?format(new Date(a.appointment_date+'T00:00:00'),'MMM d, yyyy'):'—'}</td>
                                <td style={{padding:'1rem 1.125rem', fontFamily:F_NUM, fontSize:'0.85rem', color:'var(--text-muted)'}}>{a.appointment_time||'—'}</td>
                                <td style={{padding:'1rem 1.125rem', fontFamily:F_NUM, fontSize:'0.85rem', color:'var(--text-muted)', whiteSpace:'nowrap'}}>{a.created_at?format(new Date(a.created_at),'MMM d, yyyy'):'—'}</td>
                                <td style={{padding:'1rem 1.125rem'}}>
                                  <button onClick={()=>{setSelected(a);setNotes(a.notes||'');setDateVal(a.appointment_date||'')}} style={{display:'flex', alignItems:'center', gap:'5px', padding:'0.4rem 0.9rem', borderRadius:'8px', fontFamily:F_BODY, fontSize:'0.85rem', fontWeight:500, cursor:'pointer', background:'var(--gold-pale)', color:'var(--gold)', border:'1px solid var(--gold-border)', whiteSpace:'nowrap'}}>
                                    <Eye size={12}/> View
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

            {/* Messages list */}
            {msgTab&&(
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {loading ? <div style={{display:'flex', justifyContent:'center', padding:'6rem 0'}}><Loader2 size={28} className="animate-spin" style={{color:'var(--gold)'}}/></div>
                : msgs.length===0 ? (
                  <div style={{...CARD, padding:'4rem', textAlign:'center'}}>
                    <Mail size={32} style={{color:'var(--text-faint)', margin:'0 auto 0.875rem'}}/>
                    <p style={{fontFamily:F_BODY, fontSize:'1.2rem', color:'var(--text-primary)', fontWeight:500}}>No messages yet</p>
                  </div>
                ) : msgs.map(msg=>(
                  <div key={msg.id} style={{...CARD, padding:'1.25rem', display:'flex', alignItems:'center', gap:'1rem', borderLeft:`3px solid ${!msg.read?'var(--gold)':'transparent'}`}}>
                    <div style={{flex:1, minWidth:0, cursor:'pointer'}} onClick={()=>{setSelMsg(msg);if(!msg.read)markRead(msg.id!)}}>
                      <div style={{display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px'}}>
                        <p style={{fontWeight:600, fontSize:'0.95rem', color:'var(--text-primary)', fontFamily:F_BODY}}>{msg.name}</p>
                        <p style={{fontSize:'0.82rem', color:'var(--text-faint)', fontFamily:F_BODY}}>{msg.email}</p>
                        {!msg.read&&<span style={{background:'var(--gold-pale)', color:'var(--gold)', border:'1px solid var(--gold-border)', padding:'0.1rem 0.45rem', borderRadius:'4px', fontFamily:F_MONO, fontSize:'0.6rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase'}}>New</span>}
                      </div>
                      <p style={{fontSize:'0.9rem', color:'var(--text-secondary)', fontWeight:500, marginBottom:'3px', fontFamily:F_BODY}}>{msg.subject}</p>
                      <p style={{fontSize:'0.85rem', color:'var(--text-faint)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:F_BODY}}>{msg.message}</p>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px', flexShrink:0}}>
                      <p style={{fontFamily:F_NUM, fontSize:'0.8rem', color:'var(--text-faint)'}}>{msg.created_at?format(new Date(msg.created_at),'MMM d'):''}</p>
                      <button onClick={()=>deleteMsg(msg.id!)} style={{display:'flex', alignItems:'center', gap:'4px', padding:'0.35rem 0.8rem', borderRadius:'6px', fontFamily:F_BODY, fontSize:'0.82rem', fontWeight:500, cursor:'pointer', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444'}}>
                        <Trash2 size={12}/> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── FINANCIAL TAB ── */}
        {tab==='financial'&&(
          <>
            {/* Summary cards */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem', marginBottom:'2rem'}}>
              {[
                {label:'Total Revenue', v:totalRevenue, Icon:TrendingUp,  color:'#16A34A'},
                {label:'Total Expense', v:totalExpense, Icon:TrendingDown, color:'#DC2626'},
                {label:'Net Income',    v:netIncome,    Icon:DollarSign,   color:netIncome>=0?'#16A34A':'#DC2626'},
              ].map(({label,v,Icon,color})=>(
                <div key={label} style={{...CARD, padding:'1.75rem'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
                    <span style={{fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)'}}>{label}</span>
                    <div style={{width:'38px', height:'38px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', background:`${color}18`, border:`1px solid ${color}35`}}>
                      <Icon size={17} style={{color}}/>
                    </div>
                  </div>
                  <p style={{fontFamily:F_NUM, fontWeight:700, fontSize:'2rem', color, lineHeight:1, letterSpacing:'-0.02em'}}>{fmtPHP(v)}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'2rem'}}>
              <div style={{...CARD, padding:'1.75rem'}}>
                <p style={{fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'1.5rem'}}>Revenue vs Expense — Trend</p>
                {chartData.length===0 ? <p style={{textAlign:'center', color:'var(--text-faint)', fontSize:'0.95rem', padding:'3.5rem 0', fontFamily:F_BODY}}>No data yet</p> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="month" tick={{fontFamily:F_NUM, fontSize:'0.75rem', fill:'var(--text-faint)'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontFamily:F_NUM, fontSize:'0.75rem', fill:'var(--text-faint)'}} axisLine={false} tickLine={false} tickFormatter={v=>`₱${(Number(v)/1000).toFixed(0)}k`}/>
                      <Tooltip formatter={v=>fmtPHP(Number(v))} contentStyle={{background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'8px', fontFamily:F_BODY, fontSize:'0.9rem'}}/>
                      <Legend wrapperStyle={{fontFamily:F_BODY, fontSize:'0.85rem'}}/>
                      <Line dataKey="revenue" name="Revenue" stroke="#C9A84C" strokeWidth={2.5} dot={{r:4}} activeDot={{r:6}}/>
                      <Line dataKey="expense" name="Expense" stroke="#DC2626" strokeWidth={2.5} dot={{r:4}} activeDot={{r:6}}/>
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{...CARD, padding:'1.75rem'}}>
                <p style={{fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'1.5rem'}}>Monthly Comparison — Bar</p>
                {chartData.length===0 ? <p style={{textAlign:'center', color:'var(--text-faint)', fontSize:'0.95rem', padding:'3.5rem 0', fontFamily:F_BODY}}>No data yet</p> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} margin={{top:4,right:4,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="month" tick={{fontFamily:F_NUM, fontSize:'0.75rem', fill:'var(--text-faint)'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontFamily:F_NUM, fontSize:'0.75rem', fill:'var(--text-faint)'}} axisLine={false} tickLine={false} tickFormatter={v=>`₱${(Number(v)/1000).toFixed(0)}k`}/>
                      <Tooltip formatter={v=>fmtPHP(Number(v))} contentStyle={{background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'8px', fontFamily:F_BODY, fontSize:'0.9rem'}}/>
                      <Legend wrapperStyle={{fontFamily:F_BODY, fontSize:'0.85rem'}}/>
                      <Bar dataKey="revenue" name="Revenue" fill="#C9A84C" radius={[5,5,0,0]}/>
                      <Bar dataKey="expense" name="Expense" fill="#DC2626" radius={[5,5,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Add Record + Transaction History */}
            <div style={{display:'grid', gridTemplateColumns:'400px 1fr', gap:'1.25rem'}}>
              {/* Form */}
              <div style={{...CARD, padding:'1.75rem'}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'1.5rem'}}>
                  <Plus size={16} style={{color:'var(--gold)'}}/>
                  <p style={{fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)'}}>Add Record</p>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:'1.125rem'}}>
                  {/* Date with tracker */}
                  <div>
                    <label style={LBL}>Date</label>
                    <div style={{display:'flex', alignItems:'center', gap:'7px', marginBottom:'6px', padding:'0.4rem 0.75rem', borderRadius:'6px', background:'var(--gold-pale)', border:'1px solid var(--gold-border)'}}>
                      <Calendar size={12} style={{color:'var(--gold)', flexShrink:0}}/>
                      <span style={{fontFamily:F_BODY, fontSize:'0.82rem', color:'var(--gold)', fontWeight:500}}>
                        {finForm.record_date ? formatDateDisplay(finForm.record_date) : 'No date selected'}
                      </span>
                    </div>
                    <input type="date" value={finForm.record_date}
                      onChange={e=>setFinForm(p=>({...p,record_date:e.target.value}))}
                      className="input-luxury" style={{fontSize:'0.95rem'}}/>
                  </div>

                  {/* Type */}
                  <div>
                    <label style={LBL}>Type</label>
                    <div style={{display:'flex', gap:'8px'}}>
                      {(['revenue','expense'] as const).map(t=>(
                        <button key={t} type="button"
                          onClick={()=>{setFinForm(p=>({...p,type:t,category:'',client_name:'',client_issue:''})); setClientMode('dropdown')}}
                          style={{flex:1, padding:'0.65rem', borderRadius:'8px', fontFamily:F_MONO, fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s', background:finForm.type===t?(t==='revenue'?'rgba(22,163,74,0.15)':'rgba(220,38,38,0.12)'):'var(--bg-raised)', color:finForm.type===t?(t==='revenue'?'#16A34A':'#DC2626'):'var(--text-muted)', border:`1px solid ${finForm.type===t?(t==='revenue'?'rgba(22,163,74,0.3)':'rgba(220,38,38,0.3)'):'var(--border)'}`}}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Client Name — Revenue only, dropdown OR manual walk-in */}
                  {finForm.type==='revenue'&&(
                    <>
                      <div>
                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem'}}>
                          <label style={{...LBL, marginBottom:0}}>Client Name</label>
                          <div style={{display:'flex', borderRadius:'6px', overflow:'hidden', border:'1px solid var(--border)'}}>
                            {(['dropdown','manual'] as const).map(mode=>(
                              <button key={mode} type="button"
                                onClick={()=>{ setClientMode(mode); setFinForm(p=>({...p,client_name:'',client_issue:''})) }}
                                style={{padding:'0.25rem 0.65rem', fontFamily:F_MONO, fontSize:'0.6rem', letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', border:'none', transition:'all 0.15s',
                                  background: clientMode===mode ? 'var(--gold)' : 'var(--bg-raised)',
                                  color:       clientMode===mode ? '#fff'        : 'var(--text-faint)',
                                }}>
                                {mode==='dropdown' ? 'From Appt' : 'Walk-in'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {clientMode==='dropdown' ? (
                          <div style={{position:'relative'}}>
                            <select value={finForm.client_name}
                              onChange={e=>{
                                const name=e.target.value
                                const appt=completedAppts.find(a=>`${a.first_name} ${a.last_name}`===name)
                                setFinForm(p=>({...p, client_name:name, client_issue:appt?.issue_type||''}))
                              }}
                              className="input-luxury" style={{fontSize:'0.95rem', paddingRight:'2.25rem', appearance:'none', cursor:'pointer', width:'100%'}}>
                              <option value="">— Select client —</option>
                              {completedAppts.length===0
                                ? <option disabled>No completed appointments yet</option>
                                : completedAppts.map(a=>{
                                    const full=`${a.first_name} ${a.last_name}`
                                    return <option key={a.id} value={full}>{full}</option>
                                  })
                              }
                            </select>
                            <ChevronDown size={13} style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                          </div>
                        ) : (
                          <input type="text" placeholder="Enter client full name (walk-in)…"
                            value={finForm.client_name}
                            onChange={e=>setFinForm(p=>({...p, client_name:e.target.value}))}
                            className="input-luxury" style={{fontSize:'0.95rem'}}/>
                        )}
                      </div>
                      {/* Appointment / Issue Type — auto-filled for dropdown, editable for walk-in */}
                      <div>
                        <label style={LBL}>Appointment / Issue Type</label>
                        {clientMode==='dropdown' ? (
                          <input type="text" value={finForm.client_issue} readOnly placeholder="Auto-filled from appointment…"
                            className="input-luxury" style={{fontSize:'0.95rem', opacity: finForm.client_issue?1:0.6, cursor:'default'}}/>
                        ) : (
                          <input type="text" placeholder="e.g. Property Dispute, Notarization…"
                            value={finForm.client_issue}
                            onChange={e=>setFinForm(p=>({...p, client_issue:e.target.value}))}
                            className="input-luxury" style={{fontSize:'0.95rem'}}/>
                        )}
                      </div>
                    </>
                  )}

                  {/* Category */}
                  <div>
                    <label style={LBL}>Category</label>
                    <div style={{position:'relative'}}>
                      <select value={finForm.category} onChange={e=>setFinForm(p=>({...p,category:e.target.value}))}
                        className="input-luxury" style={{fontSize:'0.95rem', paddingRight:'2.25rem', appearance:'none', cursor:'pointer', width:'100%'}}>
                        <option value="">— Select —</option>
                        {(finForm.type==='revenue'?REVENUE_CATS:EXPENSE_CATS).map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={13} style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label style={LBL}>Amount (₱)</label>
                    <input type="number" min="0" step="0.01" placeholder="e.g. 1500.00"
                      value={finForm.amount} onChange={e=>setFinForm(p=>({...p,amount:e.target.value}))}
                      className="input-luxury" style={{fontSize:'0.95rem'}}/>
                  </div>

                  {/* Invoice — auto-generated, editable */}
                  <div>
                    <label style={LBL}>Invoice No. <span style={{color:'var(--text-faint)', textTransform:'none', letterSpacing:'normal', fontSize:'0.72rem'}}>(auto-generated, editable)</span></label>
                    <input type="text" value={finForm.invoice_number}
                      onChange={e=>setFinForm(p=>({...p,invoice_number:e.target.value}))}
                      className="input-luxury" style={{fontSize:'0.95rem'}}/>
                  </div>

                  {/* Payment method */}
                  <div>
                    <label style={LBL}>Payment Method</label>
                    <div style={{position:'relative'}}>
                      <select value={finForm.payment_method} onChange={e=>setFinForm(p=>({...p,payment_method:e.target.value}))}
                        className="input-luxury" style={{fontSize:'0.95rem', paddingRight:'2.25rem', appearance:'none', cursor:'pointer', width:'100%'}}>
                        {PAY_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
                      </select>
                      <ChevronDown size={13} style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={LBL}>Description</label>
                    <input type="text" placeholder="Brief description…"
                      value={finForm.description} onChange={e=>setFinForm(p=>({...p,description:e.target.value}))}
                      className="input-luxury" style={{fontSize:'0.95rem'}}/>
                  </div>

                  <button onClick={()=>{
                    if (!finForm.record_date||!finForm.category||!finForm.amount||!finForm.description) { toast.error('Please fill in all required fields.'); return }
                    setShowConfirm(true)
                  }} className="btn-gold" style={{width:'100%', justifyContent:'center', fontSize:'0.9rem', padding:'0.85rem', marginTop:'0.25rem'}}>
                    <Plus size={15}/> Review & Save
                  </button>
                </div>
              </div>

              {/* Transaction History */}
              <div style={{...CARD, overflow:'hidden', display:'flex', flexDirection:'column'}}>
                <div style={{padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', flexShrink:0}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.875rem'}}>
                    <p style={{fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)'}}>Transaction History</p>
                    <button onClick={exportFinCSV} style={{display:'flex', alignItems:'center', gap:'5px', padding:'0.45rem 1rem', borderRadius:'8px', fontFamily:F_BODY, fontSize:'0.85rem', fontWeight:500, cursor:'pointer', background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-secondary)'}}>
                      <Download size={13}/> Export Excel
                    </button>
                  </div>
                  {/* Filters row */}
                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                    <div style={{position:'relative'}}>
                      <Filter size={12} style={{position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)'}}/>
                      <select value={finTypeFilter} onChange={e=>setFinTypeFilter(e.target.value as 'all'|'revenue'|'expense')}
                        className="input-luxury" style={{paddingLeft:'28px', paddingTop:'0.45rem', paddingBottom:'0.45rem', fontSize:'0.85rem', paddingRight:'2rem', appearance:'none', cursor:'pointer', minWidth:'145px'}}>
                        <option value="all">All Types</option>
                        <option value="revenue">Revenue Only</option>
                        <option value="expense">Expense Only</option>
                      </select>
                      <ChevronDown size={12} style={{position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                    </div>
                    <div style={{position:'relative'}}>
                      <Calendar size={12} style={{position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)'}}/>
                      <select value={finMonthFilter} onChange={e=>setFinMonthFilter(e.target.value)}
                        className="input-luxury" style={{paddingLeft:'28px', paddingTop:'0.45rem', paddingBottom:'0.45rem', fontSize:'0.85rem', paddingRight:'2rem', appearance:'none', cursor:'pointer', minWidth:'175px'}}>
                        <option value="all">All Months</option>
                        {monthOptions.map(m=>(
                          <option key={m} value={m}>{format(parseISO(m+'-01'),'MMMM yyyy')}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} style={{position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                    </div>
                    {(finTypeFilter!=='all'||finMonthFilter!=='all')&&(
                      <button onClick={()=>{setFinTypeFilter('all');setFinMonthFilter('all')}}
                        style={{padding:'0.45rem 0.875rem', borderRadius:'8px', fontFamily:F_BODY, fontSize:'0.82rem', cursor:'pointer', background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-muted)'}}>
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                <div style={{overflowX:'auto', flex:1, maxHeight:'480px', overflowY:'auto'}}>
                  {filteredRecords.length===0 ? (
                    <p style={{textAlign:'center', color:'var(--text-faint)', fontSize:'0.95rem', padding:'3.5rem', fontFamily:F_BODY}}>No records found</p>
                  ) : (
                    <table style={{width:'100%', borderCollapse:'collapse'}}>
                      <thead style={{position:'sticky', top:0, zIndex:1}}>
                        <tr style={{background:'var(--bg-raised)', borderBottom:'1px solid var(--border)'}}>
                          {['Date','Type','Category','Amount','Invoice','Client','Issue','Payment','Description'].map(h=>(
                            <th key={h} style={{textAlign:'left', padding:'0.75rem 1rem', fontFamily:F_MONO, fontSize:'0.63rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-faint)', fontWeight:500, whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map(r=>{
                          const x=r as FinancialRecord&{invoice_number?:string;client_name?:string;client_issue?:string;payment_method?:string}
                          return (
                            <tr key={r.id} style={{borderBottom:'1px solid var(--border)'}}
                              onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='var(--bg-raised)'}
                              onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=''}>
                              <td style={{padding:'0.875rem 1rem', fontFamily:F_NUM, fontSize:'0.85rem', color:'var(--text-muted)', whiteSpace:'nowrap'}}>{format(parseISO(r.record_date),'MMM d, yyyy')}</td>
                              <td style={{padding:'0.875rem 1rem'}}>
                                <span style={{background:r.type==='revenue'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.1)', color:r.type==='revenue'?'#16A34A':'#DC2626', border:`1px solid ${r.type==='revenue'?'rgba(22,163,74,0.25)':'rgba(220,38,38,0.25)'}`, padding:'0.22rem 0.6rem', borderRadius:'4px', fontFamily:F_MONO, fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase'}}>
                                  {r.type}
                                </span>
                              </td>
                              <td style={{padding:'0.875rem 1rem', fontSize:'0.9rem', color:'var(--text-secondary)', fontFamily:F_BODY}}>{r.category}</td>
                              <td style={{padding:'0.875rem 1rem', fontFamily:F_NUM, fontSize:'0.9rem', fontWeight:700, color:r.type==='revenue'?'#16A34A':'#DC2626', whiteSpace:'nowrap'}}>{fmtPHP(r.amount)}</td>
                              <td style={{padding:'0.875rem 1rem', fontSize:'0.85rem', color:'var(--text-muted)', fontFamily:F_MONO}}>{x.invoice_number||'—'}</td>
                              <td style={{padding:'0.875rem 1rem', fontSize:'0.9rem', color:'var(--text-secondary)', fontFamily:F_BODY}}>{x.client_name||'—'}</td>
                              <td style={{padding:'0.875rem 1rem', fontSize:'0.85rem', color:'var(--text-muted)', fontFamily:F_BODY, maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{x.client_issue||'—'}</td>
                              <td style={{padding:'0.875rem 1rem', fontSize:'0.85rem', color:'var(--text-muted)', fontFamily:F_BODY}}>{x.payment_method||'—'}</td>
                              <td style={{padding:'0.875rem 1rem', fontSize:'0.85rem', color:'var(--text-muted)', fontFamily:F_BODY, maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.description}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ APPOINTMENT MODAL ══ */}
      {selected&&(
        <div style={{position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
          <div style={{...CARD, width:'100%', maxWidth:'540px', maxHeight:'90vh', overflowY:'auto', border:'1px solid var(--border-strong)'}}>
            <div style={{position:'sticky', top:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.75rem', borderBottom:'1px solid var(--border)', background:'var(--bg-surface)', zIndex:1}}>
              <div>
                <p style={{fontFamily:F_BODY, fontWeight:600, fontSize:'1.15rem', color:'var(--text-primary)'}}>Appointment Details</p>
                <p style={{fontFamily:F_MONO, fontSize:'0.65rem', color:'var(--text-faint)', marginTop:'2px'}}>ID: {selected.id?.slice(0,8)}…</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{color:'var(--text-muted)', cursor:'pointer', background:'none', border:'none'}}><X size={18}/></button>
            </div>
            <div style={{padding:'1.75rem'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.125rem', marginBottom:'1.5rem'}}>
                {([
                  ['Full Name',`${selected.first_name} ${selected.last_name}`,true],
                  ['Issue Type',selected.issue_type,true],
                  ['Address',selected.address,true],
                  ['Email',(selected as Record<string,unknown>).email as string||'—',false],
                  ['Contact',(selected as Record<string,unknown>).contact_number as string||'—',false],
                  ['Preferred Date',selected.appointment_date?format(new Date(selected.appointment_date+'T00:00:00'),'MMMM d, yyyy'):'—',false],
                  ['Preferred Time',(selected as Record<string,unknown>).appointment_time as string||'—',false],
                ] as [string,string,boolean][]).map(([lbl2,val,full])=>(
                  <div key={lbl2} style={full?{gridColumn:'1 / -1'}:{}}>
                    <p style={{...LBL, marginBottom:'4px'}}>{lbl2}</p>
                    <p style={{fontSize:'0.95rem', color:'var(--text-primary)', fontFamily:F_BODY}}>{val}</p>
                  </div>
                ))}
                {selected.description&&<div style={{gridColumn:'1 / -1'}}><p style={{...LBL, marginBottom:'4px'}}>Description</p><p style={{fontSize:'0.95rem', color:'var(--text-muted)', fontFamily:F_BODY}}>{selected.description}</p></div>}
              </div>
              <div className="rule-gold"/>
              <div style={{marginBottom:'1.25rem'}}>
                <p style={{...LBL, marginBottom:'0.75rem'}}>Update Status</p>
                <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
                  {(['pending','confirmed','completed','cancelled'] as AppStatus[]).map(s=>{
                    const st=SS[s]; const active=selected.status===s
                    return <button key={s} disabled={!!updating} onClick={()=>updateStatus(selected.id!,s)}
                      style={{background:st.bg, color:st.color, border:`1px solid ${st.border}`, padding:'0.35rem 0.875rem', borderRadius:'6px', fontFamily:F_MONO, fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', outline:active?`2px solid ${st.color}`:'none', outlineOffset:'2px', opacity:updating?0.5:1}}>
                      {updating===selected.id?'…':SL[s]}
                    </button>
                  })}
                </div>
              </div>
              <div style={{marginBottom:'1.25rem'}}>
                <p style={{...LBL, marginBottom:'0.5rem'}}>Confirm Appointment Date</p>
                <div style={{display:'flex', gap:'8px'}}>
                  <input type="date" value={dateVal} onChange={e=>setDateVal(e.target.value)} className="input-luxury" style={{flex:1, fontSize:'0.95rem'}}/>
                  <button onClick={()=>setApptDate(selected.id!)} disabled={!dateVal} className="btn-gold" style={{padding:'0.6rem 1.125rem', fontSize:'0.9rem', opacity:!dateVal?0.4:1}}>Set</button>
                </div>
              </div>
              <div style={{marginBottom:'1.125rem'}}>
                <p style={{...LBL, marginBottom:'0.5rem'}}>Secretary Notes</p>
                <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Internal notes (admin only)…" className="input-luxury" style={{resize:'none', fontSize:'0.95rem'}}/>
                <button onClick={()=>saveNotes(selected.id!)} className="btn-outline" style={{marginTop:'8px', fontSize:'0.85rem', padding:'0.45rem 0.875rem'}}>Save Notes</button>
              </div>
              <p style={{fontFamily:F_MONO, fontSize:'0.68rem', color:'var(--text-faint)'}}>
                Submitted: {selected.created_at?format(new Date(selected.created_at),'MMMM d, yyyy · h:mm a'):'—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ MESSAGE MODAL ══ */}
      {selMsg&&(
        <div style={{position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setSelMsg(null)}}>
          <div style={{...CARD, width:'100%', maxWidth:'500px', border:'1px solid var(--border-strong)'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.75rem', borderBottom:'1px solid var(--border)'}}>
              <p style={{fontFamily:F_BODY, fontWeight:600, fontSize:'1.15rem', color:'var(--text-primary)'}}>Message</p>
              <button onClick={()=>setSelMsg(null)} style={{color:'var(--text-muted)', cursor:'pointer', background:'none', border:'none'}}><X size={18}/></button>
            </div>
            <div style={{padding:'1.75rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                <div><p style={LBL}>From</p><p style={{fontSize:'0.95rem', color:'var(--text-primary)', fontWeight:600, fontFamily:F_BODY}}>{selMsg.name}</p></div>
                <div><p style={LBL}>Email</p><a href={`mailto:${selMsg.email}`} style={{fontSize:'0.95rem', color:'var(--gold)', fontWeight:500, fontFamily:F_BODY}}>{selMsg.email}</a></div>
                <div style={{gridColumn:'1/-1'}}><p style={LBL}>Subject</p><p style={{fontSize:'0.95rem', color:'var(--text-primary)', fontWeight:600, fontFamily:F_BODY}}>{selMsg.subject}</p></div>
                <div style={{gridColumn:'1/-1'}}>
                  <p style={LBL}>Message</p>
                  <p style={{fontSize:'0.95rem', color:'var(--text-secondary)', lineHeight:1.7, whiteSpace:'pre-wrap', background:'var(--bg-raised)', padding:'1rem', borderRadius:'8px', fontFamily:F_BODY}}>{selMsg.message}</p>
                </div>
              </div>
              <div className="rule-gold"/>
              <p style={{fontFamily:F_MONO, fontSize:'0.68rem', color:'var(--text-faint)'}}>{selMsg.created_at?format(new Date(selMsg.created_at),'MMMM d, yyyy · h:mm a'):''}</p>
              <div style={{display:'flex', gap:'8px'}}>
                <a href={`mailto:${selMsg.email}?subject=Re: ${selMsg.subject}`} className="btn-gold" style={{flex:1, justifyContent:'center', fontSize:'0.9rem', padding:'0.75rem', textAlign:'center', textDecoration:'none'}}>
                  <Mail size={14}/> Reply via Email
                </a>
                <button onClick={()=>deleteMsg(selMsg.id!)} style={{display:'flex', alignItems:'center', gap:'6px', padding:'0.75rem 1rem', borderRadius:'8px', fontFamily:F_BODY, fontSize:'0.9rem', fontWeight:500, cursor:'pointer', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444'}}>
                  <Trash2 size={14}/> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ FINANCIAL CONFIRM MODAL ══ */}
      {showConfirm&&(
        <div style={{position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)'}}>
          <div style={{...CARD, width:'100%', maxWidth:'460px', border:'1px solid var(--border-strong)'}}>
            <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'1.25rem 1.75rem', borderBottom:'1px solid var(--border)'}}>
              <AlertTriangle size={18} style={{color:'#D97706', flexShrink:0}}/>
              <p style={{fontFamily:F_BODY, fontWeight:600, fontSize:'1.15rem', color:'var(--text-primary)'}}>Review Before Saving</p>
            </div>
            <div style={{padding:'1.75rem'}}>
              <p style={{fontSize:'0.95rem', color:'var(--text-muted)', marginBottom:'1.25rem', lineHeight:1.65, fontFamily:F_BODY}}>
                You are about to save this record. Please double-check all details before confirming.
              </p>
              <div style={{background:'var(--bg-raised)', borderRadius:'12px', padding:'1.125rem', display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'1.5rem', border:'1px solid var(--border)'}}>
                {[
                  ['Date',       formatDateDisplay(finForm.record_date)],
                  ['Type',       finForm.type.toUpperCase()],
                  ['Category',   finForm.category],
                  ['Amount',     `₱${parseFloat(finForm.amount||'0').toLocaleString('en-PH',{minimumFractionDigits:2})}`],
                  ['Invoice No.',finForm.invoice_number||'—'],
                  ...(finForm.type==='revenue'?[['Client',finForm.client_name||'—'],['Issue',finForm.client_issue||'—']]:[]),
                  ['Payment',    finForm.payment_method],
                  ['Description',finForm.description],
                ].map(([l,v])=>(
                  <div key={l} style={{display:'flex', justifyContent:'space-between', gap:'1rem', alignItems:'flex-start'}}>
                    <span style={{fontFamily:F_MONO, fontSize:'0.67rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', flexShrink:0}}>{l}</span>
                    <span style={{fontSize:'0.95rem', color:'var(--text-primary)', fontWeight:500, textAlign:'right', fontFamily:F_BODY}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex', gap:'8px'}}>
                <button onClick={()=>setShowConfirm(false)} className="btn-outline" style={{flex:1, justifyContent:'center', fontSize:'0.9rem', padding:'0.75rem'}}>Cancel — Edit</button>
                <button onClick={saveFinancial} disabled={finLoading} className="btn-gold" style={{flex:1, justifyContent:'center', fontSize:'0.9rem', padding:'0.75rem', opacity:finLoading?0.6:1}}>
                  {finLoading?<><Loader2 size={14} className="animate-spin"/> Saving…</>:<>✓ Confirm & Save</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══ ROOT ══ */
export default function AdminPage() {
  const [auth,     setAuth]    = useState(false)
  const [checking, setChecking]= useState(true)

  useEffect(() => {
    setAuth(sessionStorage.getItem(SESSION_KEY)==='1')
    setChecking(false)
  }, [])

  const lock = () => { sessionStorage.removeItem(SESSION_KEY); setAuth(false) }

  if (checking) return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#07090F'}}>
      <Loader2 size={26} className="animate-spin" style={{color:'#C9A84C'}}/>
    </div>
  )
  return auth ? <AdminDashboard onLock={lock}/> : <PinScreen onSuccess={()=>setAuth(true)}/>
}