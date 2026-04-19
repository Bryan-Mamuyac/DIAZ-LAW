'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase, Appointment, ContactMessage, FinancialRecord } from '@/lib/supabase'
import {
  CalendarCheck, Mail, Users, Clock, CheckCircle2, Eye,
  ChevronDown, RefreshCw, LayoutDashboard, MessageSquare,
  Search, Download, Loader2, X, Lock, Delete, Scale,
  LogOut, Sun, Moon, TrendingUp, TrendingDown, DollarSign,
  Plus, AlertTriangle, Trash2, BarChart2, Bell,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

/* ─── Constants ─── */
const ADMIN_PIN    = '121212'
const SESSION_KEY  = 'diazlaw_admin_auth'
const THEME_KEY    = 'diazlaw-theme'
const MAX_ATTEMPTS = 5
const LOCK_SECS    = 180

const REVENUE_CATS = ['Consultation Fee','Notarial Fee','Legal Representation','Document Drafting','Other Revenue']
const EXPENSE_CATS = ['Office Supplies','Utilities','Rent','Transportation','Miscellaneous Expense']
const CHART_COLORS = ['#C9A84C','#2563EB','#16A34A','#DC2626','#7C3AED']

/* ─── Status config ─── */
type AppStatus = Appointment['status']
const SL: Record<AppStatus,string> = { pending:'Pending', confirmed:'Confirmed', completed:'Completed', cancelled:'Cancelled' }
const SS: Record<AppStatus,{bg:string;color:string;border:string}> = {
  pending:   {bg:'rgba(234,179,8,0.12)',  color:'#B45309', border:'rgba(234,179,8,0.3)'},
  confirmed: {bg:'rgba(59,130,246,0.1)',  color:'#1D4ED8', border:'rgba(59,130,246,0.25)'},
  completed: {bg:'rgba(34,197,94,0.1)',   color:'#15803D', border:'rgba(34,197,94,0.25)'},
  cancelled: {bg:'rgba(239,68,68,0.1)',   color:'#B91C1C', border:'rgba(239,68,68,0.25)'},
}
function Badge({s}:{s:AppStatus}) {
  const st = SS[s]
  return <span style={{background:st.bg,color:st.color,border:`1px solid ${st.border}`,padding:'0.2rem 0.6rem',borderRadius:'4px',fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase'}}>{SL[s]}</span>
}

/* ══════════════════════════════════════
   PIN SCREEN
══════════════════════════════════════ */
function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin,      setPin]      = useState('')
  const [shake,    setShake]    = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked,   setLocked]   = useState(false)
  const [timer,    setTimer]    = useState(0)
  const [isDark,   setIsDark]   = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const saved = localStorage.getItem(THEME_KEY)
    setIsDark(saved === 'dark')
  }, [])

  useEffect(() => {
    if (locked && timer > 0) { timerRef.current = setTimeout(() => setTimer(t => t-1), 1000) }
    else if (locked && timer === 0 && attempts > 0) { setLocked(false); setAttempts(0); setPin('') }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [locked, timer, attempts])

  const checkPin = useCallback((p: string) => {
    if (p === ADMIN_PIN) { sessionStorage.setItem(SESSION_KEY,'1'); onSuccess(); return }
    setShake(true); setTimeout(() => { setShake(false); setPin('') }, 550)
    const n = attempts + 1; setAttempts(n)
    if (n >= MAX_ATTEMPTS) { setLocked(true); setTimer(LOCK_SECS); toast.error(`Locked for ${LOCK_SECS/60} minutes.`) }
    else toast.error(`Wrong PIN — ${MAX_ATTEMPTS - n} attempt${MAX_ATTEMPTS-n!==1?'s':''} left`)
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

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem(THEME_KEY, next)
    document.documentElement.classList.toggle('dark', !isDark)
  }

  const mins = Math.floor(timer/60); const secs = timer%60
  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del']

  const bg    = isDark ? '#07090F'  : '#F7F5F0'
  const card  = isDark ? '#0C1120'  : '#FFFFFF'
  const brd   = isDark ? 'rgba(201,168,76,0.18)' : 'rgba(184,146,42,0.2)'
  const txt   = isDark ? '#EDE8DE'  : '#0A1628'
  const muted = isDark ? 'rgba(237,232,222,0.35)' : '#9CA3AF'

  return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',flexDirection:'column'}} onClick={()=>inputRef.current?.focus()}>
      <style>{`@keyframes pinShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}.pin-shake{animation:pinShake 0.5s ease;}`}</style>

      {/* PIN navbar */}
      <header style={{background:'#0A1628',borderBottom:'1px solid rgba(201,168,76,0.18)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 2rem',height:'56px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(201,168,76,0.15)',border:'1px solid rgba(201,168,76,0.3)'}}>
            <Scale size={15} color="#C9A84C"/>
          </div>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'0.95rem',color:'#EDE8DE',letterSpacing:'0.04em'}}>DIAZ LAW</span>
          <span style={{color:'rgba(201,168,76,0.4)',fontSize:'0.75rem',margin:'0 4px'}}>|</span>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(201,168,76,0.6)'}}>Admin Portal</span>
        </div>
        <button onClick={toggleTheme} style={{width:'36px',height:'36px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',color:'rgba(237,232,222,0.7)'}}>
          {isDark ? <Sun size={14}/> : <Moon size={14}/>}
        </button>
      </header>

      {/* PIN body */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
        <input ref={inputRef} type="tel" inputMode="numeric" maxLength={6} onChange={handleKeyInput}
          style={{position:'absolute',opacity:0,pointerEvents:'none',width:'1px',height:'1px'}}
          disabled={locked} autoComplete="off"/>

        <div style={{width:'100%',maxWidth:'340px'}}>
          <div style={{textAlign:'center',marginBottom:'2rem'}}>
            <div style={{width:'64px',height:'64px',borderRadius:'20px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.25)'}}>
              <Lock size={26} color="#C9A84C"/>
            </div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:300,fontSize:'1.75rem',color:txt,marginBottom:'0.25rem'}}>Admin Access</h1>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(201,168,76,0.6)'}}>Enter PIN to continue</p>
          </div>

          <div style={{background:card,borderRadius:'20px',padding:'2rem',border:`1px solid ${brd}`,boxShadow:'0 24px 60px rgba(0,0,0,0.2)'}}>
            <p style={{textAlign:'center',fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.1em',color:muted,marginBottom:'1rem'}}>⌨ TYPE ON KEYBOARD OR CLICK BELOW</p>

            {locked && (
              <div style={{marginBottom:'1rem',padding:'0.625rem 1rem',borderRadius:'8px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',textAlign:'center'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',fontWeight:700,color:'#ef4444'}}>LOCKED — {mins}:{String(secs).padStart(2,'0')}</p>
              </div>
            )}
            {!locked && attempts > 0 && (
              <div style={{marginBottom:'1rem',padding:'0.5rem 1rem',borderRadius:'8px',background:'rgba(234,179,8,0.08)',border:'1px solid rgba(234,179,8,0.2)',textAlign:'center'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.65rem',color:'#fcd34d'}}>{MAX_ATTEMPTS-attempts} attempt{MAX_ATTEMPTS-attempts!==1?'s':''} remaining</p>
              </div>
            )}

            {/* Dots */}
            <div className={shake?'pin-shake':''} style={{display:'flex',justifyContent:'center',gap:'10px',margin:'1.5rem 0'}}>
              {Array.from({length:6}).map((_,i)=>(
                <div key={i} style={{width:'14px',height:'14px',borderRadius:'50%',background:i<pin.length?'#C9A84C':'transparent',border:`2px solid ${i<pin.length?'#C9A84C':isDark?'rgba(201,168,76,0.3)':'rgba(184,146,42,0.3)'}`,transition:'all 0.15s',transform:i<pin.length?'scale(1.15)':'scale(1)'}}/>
              ))}
            </div>

            {/* Numpad */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              {KEYS.map((k,idx)=>{
                if(k==='') return <div key={idx}/>
                const isDel=k==='del'
                return (
                  <button key={idx} type="button" onClick={()=>numpad(k)}
                    disabled={locked||(!isDel&&pin.length>=6)}
                    style={{height:'52px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:'1.1rem',cursor:'pointer',transition:'all 0.1s',background:isDel?'rgba(239,68,68,0.08)':(isDark?'rgba(255,255,255,0.05)':'rgba(10,14,26,0.04)'),color:isDel?'#ef4444':txt,border:`1px solid ${isDel?'rgba(239,68,68,0.2)':(isDark?'rgba(237,232,222,0.1)':'rgba(10,14,26,0.1)')}`,opacity:locked?0.3:1}}
                    onMouseDown={e=>{(e.currentTarget as HTMLButtonElement).style.background=isDel?'rgba(239,68,68,0.18)':'rgba(201,168,76,0.15)'}}
                    onMouseUp={e=>{(e.currentTarget as HTMLButtonElement).style.background=isDel?'rgba(239,68,68,0.08)':(isDark?'rgba(255,255,255,0.05)':'rgba(10,14,26,0.04)')}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=isDel?'rgba(239,68,68,0.08)':(isDark?'rgba(255,255,255,0.05)':'rgba(10,14,26,0.04)')}}
                  >
                    {isDel?<Delete size={16}/>:k}
                  </button>
                )
              })}
            </div>
            <p style={{textAlign:'center',fontFamily:"'DM Mono',monospace",fontSize:'0.55rem',color:muted,marginTop:'1.25rem',letterSpacing:'0.1em'}}>AUTHORIZED PERSONNEL ONLY</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════ */
type Tab = 'appointments'|'financial'
type SFilter = 'all'|AppStatus

function AdminDashboard({ onLock }: { onLock: () => void }) {
  const [tab,       setTab]       = useState<Tab>('appointments')
  const [msgTab,    setMsgTab]    = useState(false)  // appointments sub-tab: false=appts, true=messages
  const [appts,     setAppts]     = useState<Appointment[]>([])
  const [msgs,      setMsgs]      = useState<ContactMessage[]>([])
  const [records,   setRecords]   = useState<FinancialRecord[]>([])
  const [loading,   setLoading]   = useState(true)
  const [sFilter,   setSFilter]   = useState<SFilter>('all')
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState<Appointment|null>(null)
  const [selMsg,    setSelMsg]    = useState<ContactMessage|null>(null)
  const [updating,  setUpdating]  = useState<string|null>(null)
  const [dateVal,   setDateVal]   = useState('')
  const [notes,     setNotes]     = useState('')
  const [isDark,    setIsDark]    = useState(false)
  const [mounted,   setMounted]   = useState(false)

  // Financial form state
  const [finForm,   setFinForm]   = useState({ record_date: '', type: 'revenue' as 'revenue'|'expense', category: '', amount: '', description: '' })
  const [showConfirm, setShowConfirm] = useState(false)
  const [finLoading,  setFinLoading]  = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem(THEME_KEY)
    const dark = saved === 'dark'
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: a }, { data: m }, { data: r }] = await Promise.all([
      supabase.from('appointments').select('*').order('created_at',{ascending:false}),
      supabase.from('contact_messages').select('*').order('created_at',{ascending:false}),
      supabase.from('financial_records').select('*').order('record_date',{ascending:false}),
    ])
    setAppts((a as Appointment[])||[])
    setMsgs((m as ContactMessage[])||[])
    setRecords((r as FinancialRecord[])||[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = appts.filter(a => {
    const ok = sFilter==='all'||a.status===sFilter
    const q  = !search||`${a.first_name} ${a.last_name} ${a.issue_type}`.toLowerCase().includes(search.toLowerCase())
    return ok && q
  })

  const unreadMsgs  = msgs.filter(m=>!m.read).length
  const newAppts    = appts.filter(a=>a.status==='pending').length

  const stats = {
    total:     appts.length,
    pending:   appts.filter(a=>a.status==='pending').length,
    confirmed: appts.filter(a=>a.status==='confirmed').length,
    completed: appts.filter(a=>a.status==='completed').length,
    unread:    unreadMsgs,
  }

  // Financial stats
  const totalRevenue = records.filter(r=>r.type==='revenue').reduce((s,r)=>s+r.amount,0)
  const totalExpense = records.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0)
  const netIncome    = totalRevenue - totalExpense

  // Chart data — group by month
  const chartData = useMemo(() => {
    const months: Record<string,{month:string,revenue:number,expense:number}> = {}
    records.forEach(r => {
      const m = format(parseISO(r.record_date),'MMM yyyy')
      if (!months[m]) months[m] = {month:m,revenue:0,expense:0}
      if (r.type==='revenue') months[m].revenue += r.amount
      else months[m].expense += r.amount
    })
    return Object.values(months).slice(-6).reverse()
  }, [records])

  const pieData = useMemo(() => {
    const cats: Record<string,number> = {}
    records.filter(r=>r.type==='expense').forEach(r => {
      cats[r.category] = (cats[r.category]||0) + r.amount
    })
    return Object.entries(cats).map(([name,value])=>({name,value}))
  }, [records])

  // Actions
  const updateStatus = async (id:string, status:AppStatus) => {
    setUpdating(id)
    await supabase.from('appointments').update({status,notes:notes||undefined}).eq('id',id)
    setAppts(p=>p.map(a=>a.id===id?{...a,status}:a))
    if (selected?.id===id) setSelected(p=>p?{...p,status}:null)
    toast.success(`Status → ${SL[status]}`)
    setUpdating(null)
  }
  const setDate = async (id:string) => {
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
    if (!confirm('Delete this message? This cannot be undone.')) return
    await supabase.from('contact_messages').delete().eq('id',id)
    setMsgs(p=>p.filter(m=>m.id!==id))
    if (selMsg?.id===id) setSelMsg(null)
    toast.success('Message deleted.')
  }

  // Financial save
  const saveFinancial = async () => {
    setFinLoading(true)
    const { error } = await supabase.from('financial_records').insert([{
      record_date:  finForm.record_date,
      type:         finForm.type,
      category:     finForm.category,
      amount:       parseFloat(finForm.amount),
      description:  finForm.description,
    }])
    if (!error) {
      toast.success('Record saved successfully!')
      setFinForm({record_date:'',type:'revenue',category:'',amount:'',description:''})
      setShowConfirm(false)
      fetchAll()
    } else { toast.error('Failed to save record.') }
    setFinLoading(false)
  }

  const exportApptCSV = () => {
    const h = ['ID','First','Last','Email','Contact','Address','Issue','Status','Appt Date','Appt Time','Submitted']
    const r = filtered.map((a:Appointment)=>[
      a.id,a.first_name,a.last_name,
      (a as Record<string,unknown>).email||'',
      (a as Record<string,unknown>).contact_number||'',
      `"${a.address}"`,`"${a.issue_type}"`,a.status,
      a.appointment_date||'',(a as Record<string,unknown>).appointment_time||'',
      format(new Date(a.created_at!),'MMM d yyyy HH:mm'),
    ])
    const csv=[h,...r].map(x=>x.join(',')).join('\n')
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    const el=document.createElement('a');el.href=url;el.download='appointments.csv';el.click()
    URL.revokeObjectURL(url)
  }

  const exportFinCSV = () => {
    const h = ['Date','Type','Category','Amount','Description']
    const r = records.map(rec=>[rec.record_date,rec.type,rec.category,rec.amount,`"${rec.description}"`])
    const csv=[h,...r].map(x=>x.join(',')).join('\n')
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    const el=document.createElement('a');el.href=url;el.download='financial_records.csv';el.click()
    URL.revokeObjectURL(url)
  }

  // Styles
  const navBg     = '#0A1628'
  const pageBg    = 'var(--bg-canvas)'
  const cardStyle: React.CSSProperties = {background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'16px',boxShadow:'var(--shadow-md)'}
  const fmtPHP    = (n:number) => `₱${n.toLocaleString('en-PH',{minimumFractionDigits:2})}`

  if (!mounted) return null

  return (
    <div style={{minHeight:'100vh',background:pageBg}}>
      {/* ── Admin Navbar ── */}
      <header style={{position:'sticky',top:0,zIndex:50,background:navBg,borderBottom:'1px solid rgba(201,168,76,0.2)',boxShadow:'0 2px 20px rgba(0,0,0,0.4)'}}>
        <div style={{maxWidth:'1280px',margin:'0 auto',padding:'0 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',height:'56px'}}>
          {/* Brand */}
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(201,168,76,0.15)',border:'1px solid rgba(201,168,76,0.3)'}}>
              <Scale size={15} color="#C9A84C"/>
            </div>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:600,fontSize:'0.9rem',color:'#EDE8DE',letterSpacing:'0.04em'}}>DIAZ LAW</span>
            <span style={{color:'rgba(201,168,76,0.35)',fontSize:'0.75rem',margin:'0 6px'}}>|</span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.55rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(201,168,76,0.55)'}}>Admin Portal</span>
          </div>

          {/* Nav tabs */}
          <nav style={{display:'flex',alignItems:'center',gap:'4px'}}>
            {/* Appointments tab with notification */}
            <div style={{position:'relative'}}>
              <button onClick={()=>setTab('appointments')}
                style={{display:'flex',alignItems:'center',gap:'6px',padding:'0.4rem 0.9rem',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.8rem',fontWeight:500,cursor:'pointer',transition:'all 0.2s',background:tab==='appointments'?'rgba(201,168,76,0.18)':'transparent',color:tab==='appointments'?'#C9A84C':'rgba(237,232,222,0.65)',border:tab==='appointments'?'1px solid rgba(201,168,76,0.3)':'1px solid transparent'}}>
                <LayoutDashboard size={13}/>
                Appointments
              </button>
              {(newAppts > 0 || unreadMsgs > 0) && (
                <span style={{position:'absolute',top:'-6px',right:'-6px',background:'#ef4444',color:'#fff',borderRadius:'50%',width:'18px',height:'18px',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Mono',monospace",fontSize:'0.55rem',fontWeight:700,border:'2px solid #0A1628'}}>
                  {newAppts + unreadMsgs}
                </span>
              )}
            </div>

            <button onClick={()=>setTab('financial')}
              style={{display:'flex',alignItems:'center',gap:'6px',padding:'0.4rem 0.9rem',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.8rem',fontWeight:500,cursor:'pointer',transition:'all 0.2s',background:tab==='financial'?'rgba(201,168,76,0.18)':'transparent',color:tab==='financial'?'#C9A84C':'rgba(237,232,222,0.65)',border:tab==='financial'?'1px solid rgba(201,168,76,0.3)':'1px solid transparent'}}>
              <BarChart2 size={13}/>
              Financial
            </button>
          </nav>

          {/* Right controls */}
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            {/* Refresh */}
            <button onClick={fetchAll} style={{width:'32px',height:'32px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',color:'rgba(237,232,222,0.6)'}}>
              <RefreshCw size={13} className={loading?'animate-spin':''}/>
            </button>
            {/* Theme */}
            <button onClick={toggleTheme} style={{width:'32px',height:'32px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer',color:'rgba(237,232,222,0.6)'}}>
              {isDark?<Sun size={13}/>:<Moon size={13}/>}
            </button>
            {/* Lock */}
            <button onClick={onLock}
              style={{display:'flex',alignItems:'center',gap:'6px',padding:'0.375rem 0.875rem',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.75rem',fontWeight:500,cursor:'pointer',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.25)',color:'#fca5a5'}}
              onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(239,68,68,0.2)'}
              onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(239,68,68,0.1)'}>
              <LogOut size={12}/> Lock
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <div style={{maxWidth:'1280px',margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* ══ APPOINTMENTS TAB ══ */}
        {tab==='appointments' && (
          <>
            {/* Stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'1rem',marginBottom:'1.75rem'}}>
              {[
                {label:'Total',     v:stats.total,     Icon:CalendarCheck, color:'#C9A84C'},
                {label:'Pending',   v:stats.pending,   Icon:Clock,         color:'#D97706'},
                {label:'Confirmed', v:stats.confirmed, Icon:CheckCircle2,  color:'#2563EB'},
                {label:'Completed', v:stats.completed, Icon:Users,         color:'#16A34A'},
                {label:'Unread Msgs',v:stats.unread,   Icon:Mail,          color:'#DC2626'},
              ].map(({label,v,Icon,color})=>(
                <div key={label} style={{...cardStyle,padding:'1.25rem'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.75rem'}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-muted)'}}>{label}</p>
                    <Icon size={14} style={{color}}/>
                  </div>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'2rem',color:'var(--text-primary)',lineHeight:1,letterSpacing:'-0.02em'}}>{v}</p>
                </div>
              ))}
            </div>

            {/* Sub-tabs: Appointments | Messages */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem'}}>
              <div style={{display:'flex',gap:'8px'}}>
                {/* Appointments sub-tab */}
                <div style={{position:'relative'}}>
                  <button onClick={()=>setMsgTab(false)}
                    style={{display:'flex',alignItems:'center',gap:'6px',padding:'0.5rem 1rem',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.8rem',fontWeight:500,cursor:'pointer',background:!msgTab?'var(--gold)':'var(--bg-surface)',color:!msgTab?'#fff':'var(--text-muted)',border:`1px solid ${!msgTab?'var(--gold)':'var(--border)'}`}}>
                    <LayoutDashboard size={13}/>
                    Appointments
                    {newAppts>0&&<span style={{background:!msgTab?'rgba(255,255,255,0.25)':'var(--gold-pale)',color:!msgTab?'#fff':'var(--gold)',borderRadius:'4px',padding:'0.1rem 0.4rem',fontSize:'0.65rem',fontWeight:700}}>{newAppts}</span>}
                  </button>
                </div>
                {/* Messages sub-tab */}
                <div style={{position:'relative'}}>
                  <button onClick={()=>setMsgTab(true)}
                    style={{display:'flex',alignItems:'center',gap:'6px',padding:'0.5rem 1rem',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.8rem',fontWeight:500,cursor:'pointer',background:msgTab?'var(--gold)':'var(--bg-surface)',color:msgTab?'#fff':'var(--text-muted)',border:`1px solid ${msgTab?'var(--gold)':'var(--border)'}`}}>
                    <MessageSquare size={13}/>
                    Messages
                    {unreadMsgs>0&&<span style={{background:msgTab?'rgba(255,255,255,0.25)':'rgba(220,38,38,0.1)',color:msgTab?'#fff':'#DC2626',borderRadius:'4px',padding:'0.1rem 0.4rem',fontSize:'0.65rem',fontWeight:700}}>{unreadMsgs}</span>}
                  </button>
                  {unreadMsgs>0&&<span style={{position:'absolute',top:'-6px',right:'-6px',background:'#ef4444',color:'#fff',borderRadius:'50%',width:'16px',height:'16px',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Mono',monospace",fontSize:'0.5rem',fontWeight:700,border:'2px solid var(--bg-canvas)'}}>{unreadMsgs}</span>}
                </div>
              </div>
              <button onClick={fetchAll} style={{display:'flex',alignItems:'center',gap:'6px',padding:'0.4rem 0.875rem',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.75rem',fontWeight:500,cursor:'pointer',background:'var(--bg-surface)',border:'1px solid var(--border)',color:'var(--text-muted)'}}>
                <RefreshCw size={12} className={loading?'animate-spin':''}/> Refresh
              </button>
            </div>

            {/* ── Appointments list ── */}
            {!msgTab && (
              <>
                <div style={{display:'flex',gap:'10px',marginBottom:'1rem',flexWrap:'wrap'}}>
                  <div style={{position:'relative',flex:1,minWidth:'200px'}}>
                    <Search size={13} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--text-faint)'}}/>
                    <input type="text" placeholder="Search by name or issue…" value={search} onChange={e=>setSearch(e.target.value)}
                      className="input-luxury" style={{paddingLeft:'2.25rem',paddingTop:'0.5rem',paddingBottom:'0.5rem',fontSize:'0.875rem',width:'100%'}}/>
                  </div>
                  <div style={{position:'relative'}}>
                    <select value={sFilter} onChange={e=>setSFilter(e.target.value as SFilter)}
                      className="input-luxury" style={{paddingTop:'0.5rem',paddingBottom:'0.5rem',fontSize:'0.875rem',paddingRight:'2rem',minWidth:'150px',appearance:'none',cursor:'pointer'}}>
                      <option value="all">All Status</option>
                      {(['pending','confirmed','completed','cancelled'] as AppStatus[]).map(s=><option key={s} value={s}>{SL[s]}</option>)}
                    </select>
                    <ChevronDown size={13} style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text-faint)'}}/>
                  </div>
                  <button onClick={exportApptCSV} style={{display:'flex',alignItems:'center',gap:'6px',padding:'0.5rem 1rem',borderRadius:'10px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.75rem',fontWeight:500,cursor:'pointer',background:'var(--bg-surface)',border:'1px solid var(--border)',color:'var(--text-secondary)'}}>
                    <Download size={13}/> Export CSV
                  </button>
                </div>

                {loading ? <div style={{display:'flex',justifyContent:'center',padding:'6rem 0'}}><Loader2 size={26} className="animate-spin" style={{color:'var(--gold)'}}/></div>
                : filtered.length===0 ? (
                  <div style={{...cardStyle,padding:'4rem',textAlign:'center'}}>
                    <CalendarCheck size={28} style={{color:'var(--text-faint)',margin:'0 auto 0.75rem'}}/>
                    <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.15rem',color:'var(--text-primary)'}}>No appointments found</p>
                    <p style={{fontSize:'0.85rem',color:'var(--text-muted)',marginTop:'0.25rem'}}>Try adjusting your filters</p>
                  </div>
                ) : (
                  <div style={{...cardStyle,overflow:'hidden'}}>
                    <div style={{overflowX:'auto'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.875rem'}}>
                        <thead>
                          <tr style={{background:'var(--bg-raised)',borderBottom:'1px solid var(--border)'}}>
                            {['#','Client','Issue','Status','Date','Time','Submitted',''].map(h=>(
                              <th key={h} style={{textAlign:'left',padding:'0.75rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--text-faint)',fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((appt,i)=>{
                            const a = appt as Appointment & {appointment_time?:string}
                            return (
                              <tr key={a.id} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}}
                                onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='var(--bg-raised)'}
                                onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=''}>
                                <td style={{padding:'0.875rem 1rem',color:'var(--text-faint)',fontFamily:"'DM Mono',monospace",fontSize:'0.7rem'}}>{i+1}</td>
                                <td style={{padding:'0.875rem 1rem'}}>
                                  <p style={{fontWeight:500,color:'var(--text-primary)',fontSize:'0.85rem'}}>{a.first_name} {a.last_name}</p>
                                  <p style={{fontSize:'0.72rem',color:'var(--text-faint)',marginTop:'2px'}}>{(a as Record<string,unknown>).contact_number as string||a.address}</p>
                                </td>
                                <td style={{padding:'0.875rem 1rem',maxWidth:'160px'}}><p style={{fontSize:'0.75rem',color:'var(--text-secondary)',lineHeight:1.4}}>{a.issue_type}</p></td>
                                <td style={{padding:'0.875rem 1rem'}}><Badge s={a.status}/></td>
                                <td style={{padding:'0.875rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.72rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{a.appointment_date?format(new Date(a.appointment_date+'T00:00:00'),'MMM d, yyyy'):'—'}</td>
                                <td style={{padding:'0.875rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.72rem',color:'var(--text-muted)'}}>{a.appointment_time||'—'}</td>
                                <td style={{padding:'0.875rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.72rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{a.created_at?format(new Date(a.created_at),'MMM d, yyyy'):'—'}</td>
                                <td style={{padding:'0.875rem 1rem'}}>
                                  <button onClick={()=>{setSelected(a);setNotes(a.notes||'');setDateVal(a.appointment_date||'')}}
                                    style={{display:'flex',alignItems:'center',gap:'5px',padding:'0.3rem 0.7rem',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.75rem',fontWeight:500,cursor:'pointer',background:'var(--gold-pale)',color:'var(--gold)',border:'1px solid var(--gold-border)',whiteSpace:'nowrap'}}>
                                    <Eye size={11}/> View
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

            {/* ── Messages list ── */}
            {msgTab && (
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                {loading ? <div style={{display:'flex',justifyContent:'center',padding:'6rem 0'}}><Loader2 size={26} className="animate-spin" style={{color:'var(--gold)'}}/></div>
                : msgs.length===0 ? (
                  <div style={{...cardStyle,padding:'4rem',textAlign:'center'}}>
                    <Mail size={28} style={{color:'var(--text-faint)',margin:'0 auto 0.75rem'}}/>
                    <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.15rem',color:'var(--text-primary)'}}>No messages yet</p>
                  </div>
                ) : msgs.map(msg=>(
                  <div key={msg.id} style={{...cardStyle,padding:'1.125rem',display:'flex',alignItems:'center',gap:'1rem',borderLeft:`3px solid ${!msg.read?'var(--gold)':'transparent'}`}}>
                    <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>{setSelMsg(msg);if(!msg.read)markRead(msg.id!)}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBottom:'4px'}}>
                        <p style={{fontWeight:500,fontSize:'0.875rem',color:'var(--text-primary)'}}>{msg.name}</p>
                        <p style={{fontSize:'0.75rem',color:'var(--text-faint)'}}>{msg.email}</p>
                        {!msg.read&&<span style={{background:'var(--gold-pale)',color:'var(--gold)',border:'1px solid var(--gold-border)',padding:'0.1rem 0.45rem',borderRadius:'4px',fontFamily:"'DM Mono',monospace",fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase'}}>New</span>}
                      </div>
                      <p style={{fontSize:'0.8rem',color:'var(--text-secondary)',fontWeight:500,marginBottom:'2px'}}>{msg.subject}</p>
                      <p style={{fontSize:'0.75rem',color:'var(--text-faint)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{msg.message}</p>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'8px',flexShrink:0}}>
                      <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--text-faint)'}}>{msg.created_at?format(new Date(msg.created_at),'MMM d'):''}</p>
                      <button onClick={()=>deleteMsg(msg.id!)}
                        style={{display:'flex',alignItems:'center',gap:'4px',padding:'0.25rem 0.6rem',borderRadius:'6px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.72rem',fontWeight:500,cursor:'pointer',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:'#ef4444'}}
                        onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(239,68,68,0.18)'}
                        onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background='rgba(239,68,68,0.08)'}>
                        <Trash2 size={11}/> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══ FINANCIAL TAB ══ */}
        {tab==='financial' && (
          <>
            {/* Summary cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1.75rem'}}>
              {[
                {label:'Total Revenue', v:totalRevenue, Icon:TrendingUp,   color:'#16A34A'},
                {label:'Total Expense', v:totalExpense, Icon:TrendingDown,  color:'#DC2626'},
                {label:'Net Income',    v:netIncome,    Icon:DollarSign,    color: netIncome>=0?'#16A34A':'#DC2626'},
              ].map(({label,v,Icon,color})=>(
                <div key={label} style={{...cardStyle,padding:'1.5rem'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.75rem'}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-muted)'}}>{label}</p>
                    <Icon size={16} style={{color}}/>
                  </div>
                  <p style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'1.75rem',color,lineHeight:1}}>{fmtPHP(v)}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1rem',marginBottom:'1.75rem'}}>
              {/* Line + Bar combo */}
              <div style={{...cardStyle,padding:'1.5rem'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1.25rem'}}>Revenue vs Expense (Last 6 Months)</p>
                {chartData.length===0 ? <p style={{textAlign:'center',color:'var(--text-faint)',fontSize:'0.875rem',padding:'3rem 0'}}>No data yet</p> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{top:0,right:0,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                      <XAxis dataKey="month" tick={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',fill:'var(--text-faint)'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',fill:'var(--text-faint)'}} axisLine={false} tickLine={false} tickFormatter={v=>`₱${(v/1000).toFixed(0)}k`}/>
                      <Tooltip formatter={(v)=>fmtPHP(Number(v))} contentStyle={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.8rem'}}/>
                      <Legend wrapperStyle={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem'}}/>
                      <Bar dataKey="revenue" name="Revenue" fill="#C9A84C" radius={[4,4,0,0]}/>
                      <Bar dataKey="expense" name="Expense" fill="#DC2626" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Pie chart */}
              <div style={{...cardStyle,padding:'1.5rem'}}>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:'1.25rem'}}>Expense Breakdown</p>
                {pieData.length===0 ? <p style={{textAlign:'center',color:'var(--text-faint)',fontSize:'0.875rem',padding:'3rem 0'}}>No expenses yet</p> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${((percent??0)*100).toFixed(0)}%`} labelLine={false} style={{fontFamily:"'DM Mono',monospace",fontSize:'0.55rem'}}>
                        {pieData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v)=>fmtPHP(Number(v))} contentStyle={{background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.8rem'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Add record form + table */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'1rem'}}>
              {/* Input form */}
              <div style={{...cardStyle,padding:'1.5rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'1.25rem'}}>
                  <Plus size={15} style={{color:'var(--gold)'}}/>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)'}}>Add Record</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'0.875rem'}}>
                  <div>
                    <label className="label-lux">Date</label>
                    <input type="date" value={finForm.record_date} onChange={e=>setFinForm(p=>({...p,record_date:e.target.value}))} className="input-luxury" style={{fontSize:'0.875rem',padding:'0.6rem 0.875rem'}}/>
                  </div>
                  <div>
                    <label className="label-lux">Type</label>
                    <div style={{display:'flex',gap:'8px'}}>
                      {(['revenue','expense'] as const).map(t=>(
                        <button key={t} type="button" onClick={()=>setFinForm(p=>({...p,type:t,category:''}))}
                          style={{flex:1,padding:'0.5rem',borderRadius:'8px',fontFamily:"'DM Mono',monospace",fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',background:finForm.type===t?(t==='revenue'?'rgba(22,163,74,0.15)':'rgba(220,38,38,0.12)'):'var(--bg-raised)',color:finForm.type===t?(t==='revenue'?'#16A34A':'#DC2626'):'var(--text-muted)',border:`1px solid ${finForm.type===t?(t==='revenue'?'rgba(22,163,74,0.3)':'rgba(220,38,38,0.3)'):'var(--border)'}`}}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label-lux">Category</label>
                    <div style={{position:'relative'}}>
                      <select value={finForm.category} onChange={e=>setFinForm(p=>({...p,category:e.target.value}))} className="input-luxury" style={{fontSize:'0.875rem',padding:'0.6rem 0.875rem',paddingRight:'2rem',appearance:'none',cursor:'pointer',width:'100%'}}>
                        <option value="">— Select —</option>
                        {(finForm.type==='revenue'?REVENUE_CATS:EXPENSE_CATS).map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown size={12} style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text-faint)'}}/>
                    </div>
                  </div>
                  <div>
                    <label className="label-lux">Amount (₱)</label>
                    <input type="number" min="0" step="0.01" placeholder="e.g. 1500.00" value={finForm.amount} onChange={e=>setFinForm(p=>({...p,amount:e.target.value}))} className="input-luxury" style={{fontSize:'0.875rem',padding:'0.6rem 0.875rem'}}/>
                  </div>
                  <div>
                    <label className="label-lux">Description</label>
                    <input type="text" placeholder="Brief description…" value={finForm.description} onChange={e=>setFinForm(p=>({...p,description:e.target.value}))} className="input-luxury" style={{fontSize:'0.875rem',padding:'0.6rem 0.875rem'}}/>
                  </div>
                  <button
                    onClick={()=>{
                      if (!finForm.record_date||!finForm.category||!finForm.amount||!finForm.description) { toast.error('Please fill in all fields.'); return }
                      setShowConfirm(true)
                    }}
                    className="btn-gold" style={{width:'100%',justifyContent:'center',fontSize:'0.8rem',padding:'0.7rem'}}>
                    <Plus size={14}/> Review & Save
                  </button>
                </div>
              </div>

              {/* Records table */}
              <div style={{...cardStyle,overflow:'hidden'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1.125rem 1.25rem',borderBottom:'1px solid var(--border)'}}>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)'}}>Transaction History</p>
                  <button onClick={exportFinCSV} style={{display:'flex',alignItems:'center',gap:'5px',padding:'0.35rem 0.75rem',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.72rem',fontWeight:500,cursor:'pointer',background:'var(--bg-raised)',border:'1px solid var(--border)',color:'var(--text-secondary)'}}>
                    <Download size={12}/> Export Excel
                  </button>
                </div>
                <div style={{overflowX:'auto',maxHeight:'420px',overflowY:'auto'}}>
                  {records.length===0 ? (
                    <p style={{textAlign:'center',color:'var(--text-faint)',fontSize:'0.875rem',padding:'3rem'}}>No records yet</p>
                  ) : (
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.8rem'}}>
                      <thead style={{position:'sticky',top:0,zIndex:1}}>
                        <tr style={{background:'var(--bg-raised)',borderBottom:'1px solid var(--border)'}}>
                          {['Date','Type','Category','Amount','Description'].map(h=>(
                            <th key={h} style={{textAlign:'left',padding:'0.625rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.57rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--text-faint)',fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {records.map(r=>(
                          <tr key={r.id} style={{borderBottom:'1px solid var(--border)'}}
                            onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='var(--bg-raised)'}
                            onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=''}>
                            <td style={{padding:'0.625rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.7rem',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{format(parseISO(r.record_date),'MMM d, yyyy')}</td>
                            <td style={{padding:'0.625rem 1rem'}}>
                              <span style={{background:r.type==='revenue'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.1)',color:r.type==='revenue'?'#16A34A':'#DC2626',border:`1px solid ${r.type==='revenue'?'rgba(22,163,74,0.25)':'rgba(220,38,38,0.25)'}`,padding:'0.15rem 0.5rem',borderRadius:'4px',fontFamily:"'DM Mono',monospace",fontSize:'0.58rem',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase'}}>
                                {r.type}
                              </span>
                            </td>
                            <td style={{padding:'0.625rem 1rem',fontSize:'0.78rem',color:'var(--text-secondary)'}}>{r.category}</td>
                            <td style={{padding:'0.625rem 1rem',fontFamily:"'DM Mono',monospace",fontSize:'0.75rem',fontWeight:600,color:r.type==='revenue'?'#16A34A':'#DC2626',whiteSpace:'nowrap'}}>{fmtPHP(r.amount)}</td>
                            <td style={{padding:'0.625rem 1rem',fontSize:'0.78rem',color:'var(--text-muted)'}}>{r.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ APPOINTMENT DETAIL MODAL ══ */}
      {selected && (
        <div style={{position:'fixed',inset:0,zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
          <div style={{...cardStyle,width:'100%',maxWidth:'520px',maxHeight:'90vh',overflowY:'auto',border:'1px solid var(--border-strong)'}}>
            <div style={{position:'sticky',top:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1.125rem 1.5rem',borderBottom:'1px solid var(--border)',background:'var(--bg-surface)',zIndex:1}}>
              <div>
                <p style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'1.1rem',color:'var(--text-primary)'}}>Appointment Details</p>
                <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.62rem',color:'var(--text-faint)',marginTop:'2px'}}>ID: {selected.id?.slice(0,8)}…</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{color:'var(--text-muted)',cursor:'pointer',background:'none',border:'none'}}><X size={18}/></button>
            </div>
            <div style={{padding:'1.5rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.25rem'}}>
                {([
                  ['Full Name',`${selected.first_name} ${selected.last_name}`,true],
                  ['Issue Type',selected.issue_type,true],
                  ['Address',selected.address,true],
                  ['Email',(selected as Record<string,unknown>).email as string||'—',false],
                  ['Contact',(selected as Record<string,unknown>).contact_number as string||'—',false],
                  ['Preferred Date',selected.appointment_date?format(new Date(selected.appointment_date+'T00:00:00'),'MMMM d, yyyy'):'—',false],
                  ['Preferred Time',(selected as Record<string,unknown>).appointment_time as string||'—',false],
                ] as [string,string,boolean][]).map(([lbl,val,full])=>(
                  <div key={lbl} style={full?{gridColumn:'1 / -1'}:{}}>
                    <p className="label-lux">{lbl}</p>
                    <p style={{fontSize:'0.875rem',color:'var(--text-primary)',marginTop:'4px'}}>{val}</p>
                  </div>
                ))}
                {selected.description&&<div style={{gridColumn:'1 / -1'}}><p className="label-lux">Description</p><p style={{fontSize:'0.875rem',color:'var(--text-muted)',marginTop:'4px'}}>{selected.description}</p></div>}
              </div>
              <div className="rule-gold"/>
              {/* Status */}
              <div style={{marginBottom:'1.125rem'}}>
                <p className="label-lux" style={{marginBottom:'0.625rem'}}>Update Status</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                  {(['pending','confirmed','completed','cancelled'] as AppStatus[]).map(s=>{
                    const st=SS[s]; const active=selected.status===s
                    return <button key={s} disabled={!!updating} onClick={()=>updateStatus(selected.id!,s)}
                      style={{background:st.bg,color:st.color,border:`1px solid ${st.border}`,padding:'0.3rem 0.8rem',borderRadius:'6px',fontFamily:"'DM Mono',monospace",fontSize:'0.65rem',fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer',outline:active?`2px solid ${st.color}`:'none',outlineOffset:'2px',opacity:updating?0.5:1}}>
                      {updating===selected.id?'…':SL[s]}
                    </button>
                  })}
                </div>
              </div>
              {/* Date */}
              <div style={{marginBottom:'1.125rem'}}>
                <p className="label-lux" style={{marginBottom:'0.5rem'}}>Confirm Appointment Date</p>
                <div style={{display:'flex',gap:'8px'}}>
                  <input type="date" value={dateVal} onChange={e=>setDateVal(e.target.value)} className="input-luxury" style={{flex:1,fontSize:'0.875rem',padding:'0.5rem 0.875rem'}}/>
                  <button onClick={()=>setDate(selected.id!)} disabled={!dateVal} className="btn-gold" style={{padding:'0.5rem 1rem',fontSize:'0.8rem',opacity:!dateVal?0.4:1}}>Set</button>
                </div>
              </div>
              {/* Notes */}
              <div style={{marginBottom:'1rem'}}>
                <p className="label-lux" style={{marginBottom:'0.5rem'}}>Secretary Notes</p>
                <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Internal notes (admin only)…" className="input-luxury" style={{resize:'none',fontSize:'0.875rem'}}/>
                <button onClick={()=>saveNotes(selected.id!)} className="btn-outline" style={{marginTop:'8px',fontSize:'0.75rem',padding:'0.4rem 0.875rem'}}>Save Notes</button>
              </div>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.65rem',color:'var(--text-faint)'}}>
                Submitted: {selected.created_at?format(new Date(selected.created_at),'MMMM d, yyyy · h:mm a'):'—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ MESSAGE MODAL ══ */}
      {selMsg && (
        <div style={{position:'fixed',inset:0,zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setSelMsg(null)}}>
          <div style={{...cardStyle,width:'100%',maxWidth:'500px',border:'1px solid var(--border-strong)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1.125rem 1.5rem',borderBottom:'1px solid var(--border)'}}>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'1.1rem',color:'var(--text-primary)'}}>Message</p>
              <button onClick={()=>setSelMsg(null)} style={{color:'var(--text-muted)',cursor:'pointer',background:'none',border:'none'}}><X size={18}/></button>
            </div>
            <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
                <div><p className="label-lux">From</p><p style={{fontSize:'0.875rem',color:'var(--text-primary)',fontWeight:500,marginTop:'4px'}}>{selMsg.name}</p></div>
                <div><p className="label-lux">Email</p><a href={`mailto:${selMsg.email}`} style={{fontSize:'0.875rem',color:'var(--gold)',fontWeight:500,marginTop:'4px',display:'block'}}>{selMsg.email}</a></div>
                <div style={{gridColumn:'1/-1'}}><p className="label-lux">Subject</p><p style={{fontSize:'0.875rem',color:'var(--text-primary)',fontWeight:500,marginTop:'4px'}}>{selMsg.subject}</p></div>
                <div style={{gridColumn:'1/-1'}}>
                  <p className="label-lux">Message</p>
                  <p style={{fontSize:'0.875rem',color:'var(--text-secondary)',lineHeight:1.7,whiteSpace:'pre-wrap',background:'var(--bg-raised)',padding:'0.875rem',borderRadius:'8px',marginTop:'4px'}}>{selMsg.message}</p>
                </div>
              </div>
              <div className="rule-gold"/>
              <p style={{fontFamily:"'DM Mono',monospace",fontSize:'0.65rem',color:'var(--text-faint)'}}>
                {selMsg.created_at?format(new Date(selMsg.created_at),'MMMM d, yyyy · h:mm a'):''}
              </p>
              <div style={{display:'flex',gap:'8px'}}>
                <a href={`mailto:${selMsg.email}?subject=Re: ${selMsg.subject}`} className="btn-gold" style={{flex:1,justifyContent:'center',fontSize:'0.8rem',padding:'0.7rem',textAlign:'center',textDecoration:'none'}}>
                  <Mail size={13}/> Reply via Email
                </a>
                <button onClick={()=>deleteMsg(selMsg.id!)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'0.7rem 1rem',borderRadius:'8px',fontFamily:"'DM Sans',sans-serif",fontSize:'0.8rem',fontWeight:500,cursor:'pointer',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',color:'#ef4444'}}>
                  <Trash2 size={13}/> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ FINANCIAL CONFIRM MODAL ══ */}
      {showConfirm && (
        <div style={{position:'fixed',inset:0,zIndex:60,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)'}}>
          <div style={{...cardStyle,width:'100%',maxWidth:'420px',border:'1px solid var(--border-strong)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'1.25rem 1.5rem',borderBottom:'1px solid var(--border)'}}>
              <AlertTriangle size={18} style={{color:'#D97706',flexShrink:0}}/>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:500,fontSize:'1.1rem',color:'var(--text-primary)'}}>Confirm Before Saving</p>
            </div>
            <div style={{padding:'1.5rem'}}>
              <p style={{fontSize:'0.875rem',color:'var(--text-muted)',marginBottom:'1.25rem',lineHeight:1.6}}>
                You are about to save the following record. Please double-check before confirming.
              </p>
              <div style={{background:'var(--bg-raised)',borderRadius:'10px',padding:'1rem',display:'flex',flexDirection:'column',gap:'0.625rem',marginBottom:'1.5rem',border:'1px solid var(--border)'}}>
                {[
                  ['Date',    finForm.record_date],
                  ['Type',    finForm.type.toUpperCase()],
                  ['Category',finForm.category],
                  ['Amount',  `₱${parseFloat(finForm.amount).toLocaleString('en-PH',{minimumFractionDigits:2})}`],
                  ['Description',finForm.description],
                ].map(([lbl,val])=>(
                  <div key={lbl} style={{display:'flex',justifyContent:'space-between',gap:'1rem'}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:'0.65rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)'}}>{lbl}</span>
                    <span style={{fontSize:'0.875rem',color:'var(--text-primary)',fontWeight:500,textAlign:'right'}}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={()=>setShowConfirm(false)} className="btn-outline" style={{flex:1,justifyContent:'center',fontSize:'0.8rem',padding:'0.7rem'}}>
                  Cancel — Edit
                </button>
                <button onClick={saveFinancial} disabled={finLoading} className="btn-gold" style={{flex:1,justifyContent:'center',fontSize:'0.8rem',padding:'0.7rem',opacity:finLoading?0.6:1}}>
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

/* ══════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════ */
export default function AdminPage() {
  const [auth,     setAuth]    = useState(false)
  const [checking, setChecking]= useState(true)

  useEffect(() => {
    setAuth(sessionStorage.getItem(SESSION_KEY)==='1')
    setChecking(false)
  }, [])

  const lock = () => { sessionStorage.removeItem(SESSION_KEY); setAuth(false) }

  if (checking) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#07090F'}}>
      <Loader2 size={24} className="animate-spin" style={{color:'#C9A84C'}}/>
    </div>
  )

  return auth
    ? <AdminDashboard onLock={lock}/>
    : <PinScreen onSuccess={()=>setAuth(true)}/>
}
