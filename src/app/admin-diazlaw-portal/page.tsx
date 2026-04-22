'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { supabase, Appointment, ContactMessage, FinancialRecord } from '@/lib/supabase'
import { ISSUE_TYPES } from '@/lib/constants'
import { useTheme } from '@/components/ThemeProvider'
import * as XLSX from 'xlsx'
import {
  CalendarCheck, Mail, Users, Clock, CheckCircle2, Eye,
  ChevronDown, RefreshCw, LayoutDashboard, MessageSquare,
  Search, Download, Loader2, X, Lock, Delete, Scale,
  LogOut, Sun, Moon, TrendingUp, TrendingDown, DollarSign,
  Plus, AlertTriangle, Trash2, BarChart2, Calendar, Filter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

/* ─────────── CONSTANTS ─────────── */
const ADMIN_PIN    = '121212'
const SESSION_KEY  = 'diazlaw_admin_auth'
const THEME_KEY    = 'diazlaw-theme'
const MAX_ATTEMPTS = 5
const LOCK_SECS    = 180

const PAY_METHODS  = ['Cash','GCash','Bank Transfer','Check','Other']

/* ─────────── FONTS ─────────── */
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

function formatTime(t: string) {
  if (!t) return '—'
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2,'0')} ${period}`
}

function generateInvoice(count: number): string {
  const yr  = new Date().getFullYear()
  const seq = String(count + 1).padStart(3, '0')
  return `INV-${yr}-${seq}`
}

/* ══════════════════════════════════════
   ICON BUTTON — theme-aware
══════════════════════════════════════ */
function IconBtn({ icon, label, onClick, danger=false, isDark }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; isDark: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
        padding:'0.375rem 0.625rem', borderRadius:'8px', cursor:'pointer', border:'none',
        background: danger
          ? (hov ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.1)')
          : isDark
            ? (hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)')
            : (hov ? 'rgba(10,14,26,0.1)' : 'rgba(10,14,26,0.05)'),
        transition:'background 0.2s', minWidth:'48px',
      }}>
      <span style={{
        color: danger ? '#ef4444' : isDark ? 'rgba(237,232,222,0.75)' : 'rgba(10,14,26,0.65)',
        display:'flex'
      }}>{icon}</span>
      <span style={{
        fontFamily:F_MONO, fontSize:'0.52rem', letterSpacing:'0.12em',
        textTransform:'uppercase',
        color: danger ? 'rgba(239,68,68,0.75)' : isDark ? 'rgba(201,168,76,0.7)' : 'rgba(184,146,42,0.85)',
        lineHeight:1, whiteSpace:'nowrap'
      }}>{label}</span>
    </button>
  )
}

/* ══════════════════════════════════
   CUSTOM CHARTS
══════════════════════════════════ */
type ChartPoint = { month: string; revenue: number; expense: number }

function CustomLineChart({ data, fmtPHP, isDark }: { data: ChartPoint[]; fmtPHP: (n:number)=>string; isDark: boolean }) {
  const [tooltip, setTooltip] = useState<{x:number;d:ChartPoint}|null>(null)
  const W = 480, H = 210, PL = 60, PR = 20, PT = 16, PB = 36
  const cW = W - PL - PR, cH = H - PT - PB
  const maxVal = Math.max(...data.flatMap(d=>[d.revenue, d.expense]), 1)
  const niceMax = Math.ceil(maxVal / 1000) * 1000 || 1000
  const yTicks = 5
  const single = data.length === 1
  const px = (i: number) => single ? PL + cW / 2 : PL + (i / (data.length - 1)) * cW
  const py = (v: number) => PT + cH - (v / niceMax) * cH
  const lineD = (key: 'revenue'|'expense') =>
    data.map((d,i) => `${i===0?'M':'L'}${px(i).toFixed(1)},${py(d[key]).toFixed(1)}`).join(' ')
  const tc = isDark ? 'rgba(200,200,200,0.55)' : 'rgba(80,80,80,0.65)'
  const gc = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'

  return (
    <div style={{position:'relative', userSelect:'none'}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height:'auto', display:'block'}}>
        {Array.from({length:yTicks+1},(_,i)=>{
          const v = (niceMax/yTicks)*i
          const y = py(v)
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W-PR} y2={y} stroke={gc} strokeDasharray="4 3"/>
              <text x={PL-8} y={y+4} textAnchor="end" fontSize={12} fill={tc} fontFamily="Inter,sans-serif">
                ₱{v>=1000?`${(v/1000).toFixed(0)}k`:'0'}
              </text>
            </g>
          )
        })}
        {data.map((d,i)=>(
          <text key={i} x={px(i)} y={H-8} textAnchor="middle" fontSize={12} fill={tc} fontFamily="Inter,sans-serif">{d.month}</text>
        ))}
        {!single && <>
          <path d={lineD('revenue')} fill="none" stroke="#C9A84C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
          <path d={lineD('expense')} fill="none" stroke="#E8707D" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
        </>}
        {data.map((d,i)=>(
          <g key={i}>
            <circle cx={px(i)} cy={py(d.revenue)} r={5} fill="#C9A84C" stroke={isDark?'#0C1120':'#fff'} strokeWidth={2}/>
            <circle cx={px(i)} cy={py(d.expense)}  r={5} fill="#E8707D" stroke={isDark?'#0C1120':'#fff'} strokeWidth={2}/>
            <text x={px(i)} y={py(d.revenue)-10} textAnchor="middle" fontSize={11} fill="#C9A84C" fontFamily="Inter,sans-serif" fontWeight="600">
              {d.revenue>=1000?`₱${(d.revenue/1000).toFixed(0)}k`:`₱${d.revenue}`}
            </text>
            <text x={px(i)} y={py(d.expense)+18} textAnchor="middle" fontSize={11} fill="#E8707D" fontFamily="Inter,sans-serif" fontWeight="600">
              {d.expense>=1000?`₱${(d.expense/1000).toFixed(0)}k`:`₱${d.expense}`}
            </text>
            <rect x={px(i)-24} y={PT} width={48} height={cH} fill="transparent"
              onMouseEnter={()=>setTooltip({x:px(i),d})}
              onMouseLeave={()=>setTooltip(null)} style={{cursor:'crosshair'}}/>
          </g>
        ))}
      </svg>
      {tooltip&&(
        <div style={{position:'absolute', top:'8px', left:`${(tooltip.x/W)*100}%`, transform:'translateX(-50%)',
          background:isDark?'#1a2235':'#fff', border:`1px solid ${isDark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)'}`,
          borderRadius:'8px', padding:'0.6rem 0.9rem', pointerEvents:'none', zIndex:10, whiteSpace:'nowrap',
          boxShadow:'0 4px 16px rgba(0,0,0,0.15)'}}>
          <p style={{fontFamily:'Inter,sans-serif', fontSize:'0.78rem', fontWeight:700, color:isDark?'#EDE8DE':'#0A1628', marginBottom:'4px'}}>{tooltip.d.month}</p>
          <p style={{fontFamily:'Inter,sans-serif', fontSize:'0.82rem', color:'#E8707D', marginBottom:'2px'}}>Expense : {fmtPHP(tooltip.d.expense)}</p>
          <p style={{fontFamily:'Inter,sans-serif', fontSize:'0.82rem', color:'#C9A84C'}}>Revenue : {fmtPHP(tooltip.d.revenue)}</p>
        </div>
      )}
      <div style={{display:'flex', justifyContent:'center', gap:'1.25rem', marginTop:'0.25rem'}}>
        {[{color:'#E8707D',label:'Expense'},{color:'#C9A84C',label:'Revenue'}].map(l=>(
          <div key={l.label} style={{display:'flex', alignItems:'center', gap:'5px'}}>
            <div style={{width:'20px', height:'3px', background:l.color, borderRadius:'2px'}}/>
            <span style={{fontFamily:'Inter,sans-serif', fontSize:'0.8rem', color:isDark?'rgba(237,232,222,0.65)':'rgba(60,60,60,0.75)'}}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomBarChart({ data, fmtPHP, isDark }: { data: ChartPoint[]; fmtPHP: (n:number)=>string; isDark: boolean }) {
  const [tooltip, setTooltip] = useState<{i:number;d:ChartPoint}|null>(null)
  const W = 480, H = 210, PL = 60, PR = 20, PT = 16, PB = 36
  const cW = W - PL - PR, cH = H - PT - PB
  const maxVal = Math.max(...data.flatMap(d=>[d.revenue, d.expense]), 1)
  const niceMax = Math.ceil(maxVal / 1000) * 1000 || 1000
  const yTicks = 5
  const groupW = cW / data.length
  const barW = Math.min(Math.max(groupW * 0.3, 18), 44)
  const gap = 6

  const bx = (i: number, which: 0|1) => PL + i*groupW + groupW/2 + (which===0 ? -(barW+gap/2) : gap/2)
  const bh = (v: number) => (v / niceMax) * cH
  const by = (v: number) => PT + cH - Math.max(bh(v), v > 0 ? 4 : 0)
  const tc = isDark ? 'rgba(200,200,200,0.55)' : 'rgba(80,80,80,0.65)'
  const gc = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'

  return (
    <div style={{position:'relative', userSelect:'none'}}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%', height:'auto', display:'block'}}>
        {Array.from({length:yTicks+1},(_,i)=>{
          const v = (niceMax/yTicks)*i
          const y = PT + cH - (v/niceMax)*cH
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W-PR} y2={y} stroke={gc} strokeDasharray="4 3"/>
              <text x={PL-8} y={y+4} textAnchor="end" fontSize={12} fill={tc} fontFamily="Inter,sans-serif">
                ₱{v>=1000?`${(v/1000).toFixed(0)}k`:'0'}
              </text>
            </g>
          )
        })}
        {data.map((d,i)=>(
          <text key={i} x={PL + i*groupW + groupW/2} y={H-8} textAnchor="middle" fontSize={12} fill={tc} fontFamily="Inter,sans-serif">{d.month}</text>
        ))}
        {data.map((d,i)=>{
          const rh = Math.max(bh(d.revenue), d.revenue>0?4:0)
          const eh = Math.max(bh(d.expense), d.expense>0?4:0)
          return (
            <g key={i}>
              <rect x={bx(i,0)} y={by(d.revenue)} width={barW} height={rh} fill="#C9A84C" rx={3}
                opacity={tooltip && tooltip.i!==i ? 0.4 : 1}/>
              {d.revenue > 0 && <text x={bx(i,0)+barW/2} y={by(d.revenue)-4} textAnchor="middle" fontSize={11} fill="#C9A84C" fontFamily="Inter,sans-serif" fontWeight="600">
                {d.revenue>=1000?`₱${(d.revenue/1000).toFixed(0)}k`:`₱${d.revenue}`}
              </text>}
              <rect x={bx(i,1)} y={by(d.expense)} width={barW} height={eh} fill="#E8707D" rx={3}
                opacity={tooltip && tooltip.i!==i ? 0.4 : 1}/>
              {d.expense > 0 && <text x={bx(i,1)+barW/2} y={by(d.expense)-4} textAnchor="middle" fontSize={11} fill="#E8707D" fontFamily="Inter,sans-serif" fontWeight="600">
                {d.expense>=1000?`₱${(d.expense/1000).toFixed(0)}k`:`₱${d.expense}`}
              </text>}
              <rect x={PL + i*groupW} y={PT} width={groupW} height={cH} fill="transparent"
                onMouseEnter={()=>setTooltip({i,d})}
                onMouseLeave={()=>setTooltip(null)} style={{cursor:'crosshair'}}/>
            </g>
          )
        })}
      </svg>
      {tooltip&&(()=>{
        const cx = PL + tooltip.i*groupW + groupW/2
        return (
          <div style={{position:'absolute', top:'8px', left:`${(cx/W)*100}%`, transform:'translateX(-50%)',
            background:isDark?'#1a2235':'#fff', border:`1px solid ${isDark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)'}`,
            borderRadius:'8px', padding:'0.6rem 0.9rem', pointerEvents:'none', zIndex:10, whiteSpace:'nowrap',
            boxShadow:'0 4px 16px rgba(0,0,0,0.15)'}}>
            <p style={{fontFamily:'Inter,sans-serif', fontSize:'0.78rem', fontWeight:700, color:isDark?'#EDE8DE':'#0A1628', marginBottom:'4px'}}>{tooltip.d.month}</p>
            <p style={{fontFamily:'Inter,sans-serif', fontSize:'0.82rem', color:'#E8707D', marginBottom:'2px'}}>Expense : {fmtPHP(tooltip.d.expense)}</p>
            <p style={{fontFamily:'Inter,sans-serif', fontSize:'0.82rem', color:'#C9A84C'}}>Revenue : {fmtPHP(tooltip.d.revenue)}</p>
          </div>
        )
      })()}
      <div style={{display:'flex', justifyContent:'center', gap:'1.25rem', marginTop:'0.25rem'}}>
        {[{color:'#E8707D',label:'Expense'},{color:'#C9A84C',label:'Revenue'}].map(l=>(
          <div key={l.label} style={{display:'flex', alignItems:'center', gap:'5px'}}>
            <div style={{width:'12px', height:'12px', background:l.color, borderRadius:'2px'}}/>
            <span style={{fontFamily:'Inter,sans-serif', fontSize:'0.8rem', color:isDark?'rgba(237,232,222,0.65)':'rgba(60,60,60,0.75)'}}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
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
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const mounted = true
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

  /* ── Theme-aware nav colors ── */
  const navBg      = isDark ? '#0A1628' : '#FFFFFF'
  const navBorder  = isDark ? 'rgba(201,168,76,0.18)' : 'rgba(184,146,42,0.22)'
  const navShadow  = isDark ? '0 2px 20px rgba(0,0,0,0.35)' : '0 2px 12px rgba(10,14,26,0.08)'
  const brandTitle = isDark ? '#EDE8DE' : '#0A1628'
  const brandSub   = isDark ? 'rgba(201,168,76,0.65)' : 'rgba(184,146,42,0.8)'
  const iconBg     = isDark ? 'rgba(201,168,76,0.15)' : 'rgba(184,146,42,0.1)'
  const iconBorder = isDark ? 'rgba(201,168,76,0.32)' : 'rgba(184,146,42,0.3)'

  /* ── Body card colors ── */
  const bg   = isDark ? '#07090F' : '#F7F5F0'
  const card = isDark ? '#0C1120' : '#FFFFFF'
  const brd  = isDark ? 'rgba(201,168,76,0.2)' : 'rgba(184,146,42,0.22)'
  const txt  = isDark ? '#EDE8DE' : '#0A1628'
  const sub  = isDark ? '#94A3B8' : '#6B7280'

  return (
    <div style={{minHeight:'100vh', background:bg, display:'flex', flexDirection:'column'}}
      onClick={() => inputRef.current?.focus()}>
      <style>{`@keyframes pinShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}.pin-shake{animation:pinShake 0.5s ease;}`}</style>

      {/* ── NAVBAR — theme-aware ── */}
      <header style={{
        height:'68px',
        background: navBg,
        borderBottom:`1px solid ${navBorder}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 2.5rem', flexShrink:0,
        boxShadow: navShadow,
        transition:'background 0.35s ease, border-color 0.35s ease',
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <div style={{width:'36px', height:'36px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', background: iconBg, border:`1px solid ${iconBorder}`}}>
            <Scale size={17} color="#C9A84C"/>
          </div>
          <div style={{lineHeight:1}}>
            <div style={{fontFamily:F_SERIF, fontWeight:600, fontSize:'1rem', color: brandTitle, letterSpacing:'0.05em', transition:'color 0.35s ease'}}> DIAZ LAW OFFICE</div>
            <div style={{fontFamily:F_MONO, fontSize:'0.52rem', letterSpacing:'0.18em', textTransform:'uppercase', color: brandSub, marginTop:'3px', transition:'color 0.35s ease'}}>Admin Portal</div>
          </div>
        </div>
        {mounted && <IconBtn icon={isDark?<Sun size={15}/>:<Moon size={15}/>} label={isDark?'Dark':'Light'} onClick={toggle} isDark={isDark}/>}
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
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const mounted = true

  const [apptPage,      setApptPage]      = useState(1)
  const APPTS_PER_PAGE = 10
  const [calView,       setCalView]       = useState({ month: new Date().getMonth(), year: new Date().getFullYear() })
  const [calModal,      setCalModal]      = useState<{ date: string; appts: Appointment[] } | null>(null)

  // Chart filter — shared for both Line and Bar
  type ChartRange = 'overall' | '1w' | '2w' | '3w' | 'month'
  const currentMonthISO = () => new Date().toISOString().slice(0, 7)
  const [chartRange, setChartRange] = useState<ChartRange>('overall')
  const [chartMonth, setChartMonth] = useState<string>(currentMonthISO())

  // Financial filters
  const [finTypeFilter,  setFinTypeFilter]  = useState<'revenue'|'expense'>('revenue')
  const [finMonthFilter, setFinMonthFilter] = useState<string>('all')
  const [transSearch,    setTransSearch]    = useState('')

  // Pagination
  const ROWS_PER_PAGE = 10
  const [revPage, setRevPage] = useState(1)
  const [expPage, setExpPage] = useState(1)

  // Financial form
  const [finForm, setFinForm] = useState({
    record_date: todayISO(), type: 'revenue' as 'revenue'|'expense',
    amount: '', description: '',
    invoice_number: '', client_name: '', client_issue: '', payment_method: 'Cash',
    appointment_type: 'Walk-in' as 'Online'|'Walk-in',
  })
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [finLoading,   setFinLoading]   = useState(false)
  const [clientMode,   setClientMode]   = useState<'dropdown'|'manual'>('dropdown')
  const [issueManual,  setIssueManual]  = useState(false)

  const ISSUE_GROUPS = Array.from(new Set(ISSUE_TYPES.map(i => i.group)))

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
    const nextInv = generateInvoice(recs.length)
    setFinForm(p => ({ ...p, invoice_number: nextInv }))
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

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

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const typeOk   = r.type===finTypeFilter
      const monthOk  = finMonthFilter==='all' || r.record_date.slice(0,7)===finMonthFilter
      const searchOk = !transSearch || ((r as Record<string,unknown>).invoice_number as string||'').toLowerCase().includes(transSearch.toLowerCase())
      return typeOk && monthOk && searchOk
    })
  }, [records, finTypeFilter, finMonthFilter, transSearch])

  const monthOptions = useMemo(() => {
    const seen = new Set<string>()
    records.forEach(r => seen.add(r.record_date.slice(0,7)))
    return Array.from(seen).sort().reverse()
  }, [records])

  // Helper: get working days (Mon-Fri) going back N days from today
  const getWorkingDays = useCallback((n: number): string[] => {
    const days: string[] = []
    const d = new Date()
    while (days.length < n) {
      const day = d.getDay()
      if (day !== 0 && day !== 6) {
        days.unshift(d.toISOString().slice(0, 10))
      }
      d.setDate(d.getDate() - 1)
    }
    return days
  }, [])

  const buildChartData = useCallback((range: ChartRange, month: string) => {
    let allowedDates: Set<string> | null = null
    if (range !== 'month' && range !== 'overall') {
      const n = range === '1w' ? 5 : range === '2w' ? 10 : 15
      allowedDates = new Set(getWorkingDays(n))
    }
    const days: Record<string, {month: string; revenue: number; expense: number}> = {}
    records.forEach(r => {
      const d = r.record_date
      if (range === 'month' && d.slice(0, 7) !== month) return
      if (allowedDates && !allowedDates.has(d)) return
      const label = range === 'month' || range === 'overall'
        ? format(parseISO(d), 'MMM d')
        : format(parseISO(d), 'MMM d')
      if (!days[d]) days[d] = {month: label, revenue: 0, expense: 0}
      if (r.type === 'revenue') days[d].revenue += r.amount
      else days[d].expense += r.amount
    })
    return Object.entries(days).sort(([a],[b]) => a.localeCompare(b)).map(([,v]) => v)
  }, [records, getWorkingDays])

  const sharedChartData = useMemo(() => buildChartData(chartRange, chartMonth), [buildChartData, chartRange, chartMonth])

  const chartData = useMemo(() => {
    const days: Record<string,{month:string;revenue:number;expense:number}> = {}
    filteredRecords.forEach(r => {
      const key = r.record_date
      const label = format(parseISO(r.record_date), 'MMM d')
      if (!days[key]) days[key] = {month:label, revenue:0, expense:0}
      if (r.type==='revenue') days[key].revenue += r.amount
      else days[key].expense += r.amount
    })
    return Object.entries(days).sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v).slice(-30)
  }, [filteredRecords])

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
    setMsgs(p=>p.filter(m=>m.id!==id))
    if (selMsg?.id===id) setSelMsg(null)
    const { error } = await supabase.from('contact_messages').delete().eq('id',id)
    if (error) {
      toast.error('Delete failed — check Supabase RLS policy.')
      fetchAll()
    } else {
      toast.success('Message deleted.')
    }
  }
  const saveFinancial = async () => {
    setFinLoading(true)
    const rec = {
      record_date:      finForm.record_date,
      type:             finForm.type,
      category:         '',
      amount:           parseFloat(parseFloat(finForm.amount).toFixed(2)),
      description:      finForm.description || '',
      invoice_number:   finForm.invoice_number||null,
      client_name:      finForm.type==='revenue'?(finForm.client_name||null):null,
      client_issue:     finForm.type==='revenue'?(finForm.client_issue||null):null,
      payment_method:   finForm.payment_method,
      appointment_type: finForm.type==='revenue'?finForm.appointment_type:null,
    }
    const { error } = await supabase.from('financial_records').insert([rec])
    if (!error) {
      toast.success('Record saved!')
      const nextCount = records.length + 1
      setFinForm({ record_date:todayISO(), type:'revenue', amount:'', description:'', invoice_number:generateInvoice(nextCount), client_name:'', client_issue:'', payment_method:'Cash', appointment_type:'Walk-in' })
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
    const year = finMonthFilter !== 'all' ? finMonthFilter.slice(0,4) : new Date().getFullYear().toString()
    const monthName = finMonthFilter !== 'all'
      ? format(parseISO(finMonthFilter+'-01'), 'MMMM').toLowerCase()
      : null
    const suffix = monthName ? `${monthName}${year}` : year
    const filename = finTypeFilter === 'revenue' ? `revenue_${suffix}.xlsx` : `expense_${suffix}.xlsx`

    const REV_HEADERS = ['Date','Type','Amount','Invoice','Appt Type','Client','Issue','Payment','Description']
    const EXP_HEADERS = ['Date','Type','Amount','Invoice','Payment','Description']

    const toRevRow = (rec: FinancialRecord) => {
      const x = rec as Record<string,unknown>
      return {
        Date:        rec.record_date,
        Type:        rec.type,
        Amount:      rec.amount,
        Invoice:     (x.invoice_number as string)||'',
        'Appt Type': (x.appointment_type as string)||'',
        Client:      (x.client_name as string)||'',
        Issue:       (x.client_issue as string)||'',
        Payment:     (x.payment_method as string)||'',
        Description: rec.description,
      }
    }
    const toExpRow = (rec: FinancialRecord) => {
      const x = rec as Record<string,unknown>
      return {
        Date:        rec.record_date,
        Type:        rec.type,
        Amount:      rec.amount,
        Invoice:     (x.invoice_number as string)||'',
        Payment:     (x.payment_method as string)||'',
        Description: rec.description,
      }
    }

    const revenues = filteredRecords.filter(r => r.type === 'revenue')
    const expenses = filteredRecords.filter(r => r.type === 'expense')
    const totalRev = revenues.reduce((s,r) => s+r.amount, 0)
    const totalExp = expenses.reduce((s,r) => s+r.amount, 0)

    const wb = XLSX.utils.book_new()

    if (finTypeFilter === 'revenue') {
      const revRows = revenues.map(toRevRow)
      const revSheet = XLSX.utils.json_to_sheet(revRows, {header: REV_HEADERS})
      XLSX.utils.sheet_add_aoa(revSheet, [
        ['','','','','','','','',''],
        ['TOTAL REVENUE','', totalRev,'','','','','',''],
      ], {origin: revRows.length + 1})
      revSheet['!cols'] = [{wch:14},{wch:10},{wch:14},{wch:14},{wch:12},{wch:20},{wch:18},{wch:12},{wch:24}]
      XLSX.utils.book_append_sheet(wb, revSheet, 'Revenue')
    } else {
      const expRows = expenses.map(toExpRow)
      const expSheet = XLSX.utils.json_to_sheet(expRows, {header: EXP_HEADERS})
      XLSX.utils.sheet_add_aoa(expSheet, [
        ['','','','','',''],
        ['TOTAL EXPENSE','', totalExp,'','',''],
      ], {origin: expRows.length + 1})
      expSheet['!cols'] = [{wch:14},{wch:10},{wch:14},{wch:16},{wch:12},{wch:24}]
      XLSX.utils.book_append_sheet(wb, expSheet, 'Expense')
    }

    XLSX.writeFile(wb, filename)
  }
  const dl = (rows:unknown[][],name:string) => {
    const csv=rows.map(x=>x.join(',')).join('\n')
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
    const el=document.createElement('a');el.href=url;el.download=name;el.click()
    URL.revokeObjectURL(url)
  }

  const fmtPHP = (n:number) => `₱${n.toLocaleString('en-PH',{minimumFractionDigits:2})}`

  /* ── Theme-aware navbar values ── */
  const navBg         = isDark ? '#0A1628' : '#FFFFFF'
  const navBorder     = isDark ? 'rgba(201,168,76,0.2)'  : 'rgba(184,146,42,0.22)'
  const navShadow     = isDark ? '0 2px 20px rgba(0,0,0,0.4)' : '0 2px 12px rgba(10,14,26,0.08)'
  const brandTitle    = isDark ? '#EDE8DE' : '#0A1628'
  const brandSub      = isDark ? 'rgba(201,168,76,0.65)' : 'rgba(184,146,42,0.8)'
  const iconBg        = isDark ? 'rgba(201,168,76,0.15)' : 'rgba(184,146,42,0.1)'
  const iconBorder    = isDark ? 'rgba(201,168,76,0.32)' : 'rgba(184,146,42,0.3)'
  const tabInactiveColor = isDark ? 'rgba(237,232,222,0.6)' : 'rgba(10,14,26,0.55)'
  const tabInactiveBg    = 'transparent'
  const tabActiveBg      = isDark ? 'rgba(201,168,76,0.18)' : 'rgba(184,146,42,0.1)'
  const tabActiveBorder  = isDark ? 'rgba(201,168,76,0.32)' : 'rgba(184,146,42,0.35)'

  // Shared styles
  const CARD: React.CSSProperties = {background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'16px', boxShadow:'var(--shadow-md)'}
  const LBL:  React.CSSProperties = {fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:'0.5rem'}

  if (!mounted) return null

  return (
    <div style={{minHeight:'100vh', background:'var(--bg-canvas)'}}>

      {/* ══ NAVBAR — fully theme-aware ══ */}
      <header style={{
        height:'68px', position:'sticky', top:0, zIndex:50,
        background: navBg,
        borderBottom:`1px solid ${navBorder}`,
        boxShadow: navShadow,
        display:'flex', alignItems:'center', minHeight:'56px',
        transition:'background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
      }}>
        <div className="admin-header-inner">
          {/* Brand */}
          <div style={{display:'flex', alignItems:'center', gap:'8px', flexShrink:0, minWidth:0}}>
            <div style={{width:'32px', height:'32px', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background: iconBg, border:`1px solid ${iconBorder}`, transition:'background 0.35s ease'}}>
              <Scale size={15} color="#C9A84C"/>
            </div>
            <div style={{lineHeight:1, minWidth:0}}>
              <div style={{fontFamily:F_SERIF, fontWeight:600, fontSize:'clamp(0.7rem, 2.5vw, 1rem)', color: brandTitle, letterSpacing:'0.04em', transition:'color 0.35s ease', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>DIAZ LAW</div>
              <div className="admin-brand-subtitle" style={{fontFamily:F_MONO, fontSize:'0.48rem', letterSpacing:'0.14em', textTransform:'uppercase', color: brandSub, marginTop:'3px', transition:'color 0.35s ease', whiteSpace:'nowrap'}}>Admin Portal</div>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="admin-nav-tabs">
            <div style={{position:'relative'}}>
              <button onClick={()=>setTab('appointments')} style={{
                display:'flex', alignItems:'center', gap:'7px',
                padding:'0.45rem 0.875rem', borderRadius:'8px', cursor:'pointer',
                fontFamily:F_BODY, fontSize:'0.85rem', fontWeight:500,
                transition:'all 0.2s',
                background: tab==='appointments' ? tabActiveBg : tabInactiveBg,
                color: tab==='appointments' ? '#C9A84C' : tabInactiveColor,
                border:`1px solid ${tab==='appointments' ? tabActiveBorder : 'transparent'}`,
              }}>
                <LayoutDashboard size={13}/> <span className="admin-brand-subtitle">Appointments</span>
              </button>
              {totalBadge>0&&<span style={{position:'absolute', top:'-7px', right:'-7px', background:'#ef4444', color:'#fff', borderRadius:'50%', width:'18px', height:'18px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F_NUM, fontSize:'0.7rem', fontWeight:700, border:`2px solid ${navBg}`}}>{totalBadge}</span>}
            </div>
            <button onClick={()=>setTab('financial')} style={{
              display:'flex', alignItems:'center', gap:'7px',
              padding:'0.45rem 0.875rem', borderRadius:'8px', cursor:'pointer',
              fontFamily:F_BODY, fontSize:'0.85rem', fontWeight:500,
              transition:'all 0.2s',
              background: tab==='financial' ? tabActiveBg : tabInactiveBg,
              color: tab==='financial' ? '#C9A84C' : tabInactiveColor,
              border:`1px solid ${tab==='financial' ? tabActiveBorder : 'transparent'}`,
            }}>
              <BarChart2 size={13}/> <span className="admin-brand-subtitle">Financial</span>
            </button>
          </nav>

          {/* Right controls */}
          <div className="admin-icon-btn-wrap" style={{display:'flex', alignItems:'center', gap:'4px', flexShrink:0}}>
            <IconBtn icon={<RefreshCw size={15} className={loading?'animate-spin':''}/>} label="Refresh" onClick={fetchAll} isDark={isDark}/>
            <IconBtn icon={isDark?<Sun size={15}/>:<Moon size={15}/>} label={isDark?'Dark':'Light'} onClick={toggle} isDark={isDark}/>
            <IconBtn icon={<LogOut size={15}/>} label="Lock" onClick={onLock} danger isDark={isDark}/>
          </div>
        </div>
      </header>

      {/* ══ PAGE ══ */}
      <div className="admin-page-wrap">

        {/* ── APPOINTMENTS TAB ── */}
        {tab==='appointments'&&(
          <>
            {/* Stats */}
            <div className="admin-stat-grid">
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
                  <p className="admin-stat-num" style={{fontFamily:F_NUM, fontWeight:700, fontSize:'2.5rem', color:'var(--text-primary)', lineHeight:1, letterSpacing:'-0.02em'}}>{v}</p>
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
                  {unreadMsgs>0&&<span style={{background:msgTab?'rgba(255,255,255,0.25)':'rgba(232,112,125,0.12)', color:msgTab?'#fff':'#DC2626', borderRadius:'4px', padding:'0.1rem 0.5rem', fontSize:'0.72rem', fontWeight:700}}>{unreadMsgs}</span>}
                </button>
              </div>
            </div>

            {/* Appointments list */}
            {!msgTab&&(
              <>
                <div style={{display:'flex', gap:'10px', marginBottom:'1rem', flexWrap:'wrap'}}>
                  <div style={{position:'relative', flex:1, minWidth:'200px'}}>
                    <Search size={14} style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)'}}/>
                    <input type="text" placeholder="Search by name or issue…" value={search} onChange={e=>{setSearch(e.target.value); setApptPage(1)}} className="input-luxury" style={{paddingLeft:'2.5rem', fontSize:'0.95rem', width:'100%'}}/>
                  </div>
                  <div style={{position:'relative'}}>
                    <select value={sFilter} onChange={e=>{setSFilter(e.target.value as 'all'|AppStatus); setApptPage(1)}} className="input-luxury" style={{paddingRight:'2.25rem', minWidth:'160px', appearance:'none', cursor:'pointer', fontSize:'0.95rem'}}>
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
                          {filtered.slice((apptPage-1)*APPTS_PER_PAGE, apptPage*APPTS_PER_PAGE).map((appt,i)=>{
                            const a=appt as Appointment&{appointment_time?:string}
                            const rowNum = (apptPage-1)*APPTS_PER_PAGE + i + 1
                            return (
                              <tr key={a.id} style={{borderBottom:'1px solid var(--border)', cursor:'pointer'}}
                                onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='var(--bg-raised)'}
                                onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=''}>
                                <td style={{padding:'1rem 1.125rem', color:'var(--text-faint)', fontFamily:F_NUM, fontSize:'0.85rem'}}>{rowNum}</td>
                                <td style={{padding:'1rem 1.125rem'}}>
                                  <p style={{fontWeight:600, color:'var(--text-primary)', fontSize:'0.95rem', fontFamily:F_BODY}}>{a.first_name} {a.last_name}</p>
                                  <p style={{fontSize:'0.8rem', color:'var(--text-faint)', marginTop:'2px', fontFamily:F_BODY}}>{(a as Record<string,unknown>).contact_number as string||a.address}</p>
                                </td>
                                <td style={{padding:'1rem 1.125rem', maxWidth:'180px'}}><p style={{fontSize:'0.9rem', color:'var(--text-secondary)', lineHeight:1.4, fontFamily:F_BODY}}>{a.issue_type}</p></td>
                                <td style={{padding:'1rem 1.125rem'}}><Badge s={a.status}/></td>
                                <td style={{padding:'1rem 1.125rem', fontFamily:F_NUM, fontSize:'0.85rem', color:'var(--text-muted)', whiteSpace:'nowrap'}}>{a.appointment_date?format(new Date(a.appointment_date+'T00:00:00'),'MMM d, yyyy'):'—'}</td>
                                <td style={{padding:'1rem 1.125rem', fontFamily:F_NUM, fontSize:'0.85rem', color:'var(--text-muted)'}}>{a.appointment_time ? formatTime(a.appointment_time) : '—'}</td>
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
                    {/* ── Numbered Pagination footer ── */}
                    {(()=>{
                      const pages = Math.ceil(filtered.length / APPTS_PER_PAGE)
                      const safePg = Math.min(apptPage, Math.max(1, pages))
                      if (pages <= 1) return (
                        <div style={{padding:'0.75rem 1.25rem', borderTop:'1px solid var(--border)', background:'var(--bg-raised)'}}>
                          <p style={{fontFamily:F_MONO, fontSize:'0.63rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-faint)'}}>
                            Showing {filtered.length} of {filtered.length}
                          </p>
                        </div>
                      )
                      return (
                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 1.25rem', borderTop:'1px solid var(--border)', background:'var(--bg-raised)', flexWrap:'wrap', gap:'8px'}}>
                          <p style={{fontFamily:F_MONO, fontSize:'0.63rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-faint)'}}>
                            {((safePg-1)*APPTS_PER_PAGE)+1}–{Math.min(safePg*APPTS_PER_PAGE, filtered.length)} of {filtered.length}
                          </p>
                          <div style={{display:'flex', gap:'4px', alignItems:'center', flexWrap:'wrap'}}>
                            <button onClick={()=>setApptPage(p=>Math.max(1,p-1))} disabled={safePg===1}
                              style={{padding:'0.3rem 0.6rem', borderRadius:'6px', fontFamily:F_MONO, fontSize:'0.72rem', fontWeight:700, cursor:safePg===1?'not-allowed':'pointer', border:`1px solid ${safePg===1?'var(--border)':'var(--gold)'}`, background:'transparent', color:safePg===1?'var(--text-faint)':'var(--gold)', opacity:safePg===1?0.4:1}}>«</button>
                            {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                              <button key={p} onClick={()=>setApptPage(p)}
                                style={{width:'32px', height:'32px', borderRadius:'6px', fontFamily:F_MONO, fontSize:'0.75rem', fontWeight:700, cursor:'pointer', border:`1px solid ${safePg===p?'var(--gold)':'var(--border)'}`, background:safePg===p?'var(--gold)':'transparent', color:safePg===p?'#fff':'var(--text-muted)', transition:'all 0.15s'}}>{p}</button>
                            ))}
                            <button onClick={()=>setApptPage(p=>Math.min(pages,p+1))} disabled={safePg===pages}
                              style={{padding:'0.3rem 0.65rem', borderRadius:'6px', fontFamily:F_MONO, fontSize:'0.72rem', fontWeight:700, cursor:safePg===pages?'not-allowed':'pointer', border:`1px solid ${safePg===pages?'var(--border)':'var(--gold)'}`, background:'transparent', color:safePg===pages?'var(--text-faint)':'var(--gold)', opacity:safePg===pages?0.4:1, letterSpacing:'0.04em'}}>NEXT »</button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </>
            )}

            {/* ── APPOINTMENT CALENDAR ── */}
            {!msgTab&&(()=>{
              const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
              const CAL_DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
              const STATUS_DOT: Record<AppStatus,string> = {
                pending:'#D97706', confirmed:'#2563EB', completed:'#16A34A', cancelled:'#B91C1C'
              }
              const todayStr = todayISO()
              const firstDay = new Date(calView.year, calView.month, 1).getDay()
              const daysInMonth = new Date(calView.year, calView.month+1, 0).getDate()

              // Map appointments by date
              const byDate: Record<string, Appointment[]> = {}
              appts.forEach(a => {
                const d = (a as Record<string,unknown>).appointment_date as string
                if (!d) return
                if (!byDate[d]) byDate[d] = []
                byDate[d].push(a)
              })

              const prevMonth = () => setCalView(v => v.month===0 ? {month:11,year:v.year-1} : {month:v.month-1,year:v.year})
              const nextMonth = () => setCalView(v => v.month===11 ? {month:0,year:v.year+1} : {month:v.month+1,year:v.year})

              const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)]

              return (
                <div style={{...CARD, marginTop:'1.5rem', overflow:'hidden'}}>
                  {/* Calendar header — top row: title + month nav */}
                  <div style={{padding:'1.25rem 1.25rem 0', background:'var(--bg-raised)'}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem', flexWrap:'wrap', marginBottom:'0.75rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', minWidth:0}}>
                      <div style={{width:'32px', height:'32px', borderRadius:'8px', background:'var(--gold-pale)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                        <Calendar size={14} style={{color:'var(--gold)'}}/>
                      </div>
                      <div style={{minWidth:0}}>
                        <p style={{fontFamily:F_MONO, fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)', fontWeight:700}}>Appointment Calendar</p>
                        <p style={{fontFamily:F_BODY, fontSize:'0.72rem', color:'var(--text-faint)', marginTop:'1px'}}>Click any day to see scheduled appointments</p>
                      </div>
                    </div>
                    {/* Month nav */}
                    <div style={{display:'flex', alignItems:'center', gap:'6px', flexShrink:0}}>
                      <button onClick={prevMonth} style={{width:'30px', height:'30px', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'var(--bg-inset)', border:'1px solid var(--border)', color:'var(--text-muted)', flexShrink:0}}>
                        <ChevronDown size={13} style={{transform:'rotate(90deg)'}}/>
                      </button>
                      <span style={{fontFamily:F_BODY, fontWeight:600, fontSize:'0.9rem', color:'var(--text-primary)', whiteSpace:'nowrap', minWidth:'110px', textAlign:'center'}}>
                        {CAL_MONTHS[calView.month]} {calView.year}
                      </span>
                      <button onClick={nextMonth} style={{width:'30px', height:'30px', borderRadius:'7px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'var(--bg-inset)', border:'1px solid var(--border)', color:'var(--text-muted)', flexShrink:0}}>
                        <ChevronDown size={13} style={{transform:'rotate(-90deg)'}}/>
                      </button>
                      <button onClick={()=>setCalView({month:new Date().getMonth(),year:new Date().getFullYear()})}
                        style={{padding:'0.3rem 0.65rem', borderRadius:'7px', fontFamily:F_MONO, fontSize:'0.62rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600, cursor:'pointer', background:'var(--gold-pale)', color:'var(--gold)', border:'1px solid var(--gold-border)', flexShrink:0}}>
                        Today
                      </button>
                    </div>
                  </div>

                  {/* Legend row */}
                  <div style={{display:'flex', gap:'10px', flexWrap:'wrap', paddingBottom:'1rem', borderTop:'1px solid var(--border)', paddingTop:'0.75rem'}}>
                    {(['pending','confirmed','completed','cancelled'] as AppStatus[]).map(s=>(
                      <div key={s} style={{display:'flex', alignItems:'center', gap:'4px'}}>
                        <div style={{width:'8px', height:'8px', borderRadius:'50%', background:STATUS_DOT[s], flexShrink:0}}/>
                        <span style={{fontFamily:F_MONO, fontSize:'0.6rem', letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-faint)'}}>{s}</span>
                      </div>
                    ))}
                  </div>
                  </div>{/* end header padding wrapper */}

                {/* Scrollable calendar grid */}
                <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch' as React.CSSProperties['WebkitOverflowScrolling']}}>
                  <div style={{minWidth:'420px'}}>
                  {/* Day headers */}
                  <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--border)'}}>
                    {CAL_DAYS.map(d=>(
                      <div key={d} style={{padding:'0.625rem', textAlign:'center', fontFamily:F_MONO, fontSize:'0.65rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-faint)', fontWeight:600,
                        borderRight: d !== 'Sat' ? '1px solid var(--border)' : 'none',
                      }}>{d}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)'}}>
                    {cells.map((day, i)=>{
                      if (!day) return (
                        <div key={`empty-${i}`} style={{minHeight:'90px', borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)', background:'var(--bg-inset)', opacity:0.4,
                          ...(i%7===6 ? {borderRight:'none'} : {})
                        }}/>
                      )
                      const dateStr = `${calView.year}-${String(calView.month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                      const dayAppts = byDate[dateStr] || []
                      const isToday = dateStr === todayStr
                      const hasAppts = dayAppts.length > 0
                      const isLastCol = (firstDay + day - 1) % 7 === 6
                      const totalRows = Math.ceil(cells.length / 7)
                      const currentRow = Math.floor((firstDay + day - 1) / 7)
                      const isLastRow = currentRow === totalRows - 1

                      return (
                        <div key={dateStr}
                          onClick={()=>{ if(hasAppts) setCalModal({date:dateStr, appts:dayAppts}) }}
                          style={{
                            minHeight:'90px', padding:'0.5rem',
                            borderRight: isLastCol ? 'none' : '1px solid var(--border)',
                            borderBottom: isLastRow ? 'none' : '1px solid var(--border)',
                            background: isToday ? (isDark?'rgba(201,168,76,0.07)':'rgba(184,146,42,0.05)') : 'var(--bg-surface)',
                            cursor: hasAppts ? 'pointer' : 'default',
                            transition:'background 0.15s',
                            position:'relative',
                          }}
                          onMouseEnter={e=>{ if(hasAppts)(e.currentTarget as HTMLDivElement).style.background=isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)' }}
                          onMouseLeave={e=>{ (e.currentTarget as HTMLDivElement).style.background=isToday?(isDark?'rgba(201,168,76,0.07)':'rgba(184,146,42,0.05)'):'var(--bg-surface)' }}
                        >
                          {/* Day number */}
                          <div style={{
                            width:'26px', height:'26px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                            fontFamily:F_NUM, fontSize:'0.82rem', fontWeight: isToday?700:400,
                            background: isToday ? 'var(--gold)' : 'transparent',
                            color: isToday ? '#fff' : 'var(--text-primary)',
                            marginBottom:'6px', flexShrink:0,
                          }}>{day}</div>

                          {/* Appointment pills */}
                          <div style={{display:'flex', flexDirection:'column', gap:'3px'}}>
                            {dayAppts.slice(0,3).map((a,idx)=>(
                              <div key={idx} style={{
                                display:'flex', alignItems:'center', gap:'4px',
                                padding:'2px 5px', borderRadius:'4px',
                                background: SS[a.status].bg,
                                border:`1px solid ${SS[a.status].border}`,
                                overflow:'hidden',
                              }}>
                                <div style={{width:'5px', height:'5px', borderRadius:'50%', background:STATUS_DOT[a.status], flexShrink:0}}/>
                                <span style={{fontFamily:F_BODY, fontSize:'0.65rem', color:SS[a.status].color, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight:500}}>
                                  {a.first_name} {a.last_name}
                                </span>
                              </div>
                            ))}
                            {dayAppts.length > 3 && (
                              <div style={{padding:'2px 5px', borderRadius:'4px', background:'var(--bg-raised)', border:'1px solid var(--border)'}}>
                                <span style={{fontFamily:F_MONO, fontSize:'0.6rem', color:'var(--text-faint)', letterSpacing:'0.06em'}}>+{dayAppts.length-3} more</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  </div>{/* end minWidth wrapper */}
                </div>{/* end scroll wrapper */}
                </div>
              )
            })()}

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
                        {msg.contact_number && <p style={{fontSize:'0.82rem', color:'var(--text-faint)', fontFamily:F_BODY}}>· {msg.contact_number}</p>}
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
            <div className="admin-fin-stat-grid">
              {[
                {label:'Total Revenue', v:totalRevenue, Icon:TrendingUp,  color:'#16A34A', bg:'rgba(22,163,74,0.08)', accent:'rgba(22,163,74,0.5)'},
                {label:'Total Expense', v:totalExpense, Icon:TrendingDown, color:'#E8707D', bg:'rgba(232,112,125,0.09)', accent:'rgba(232,112,125,0.5)'},
                {label:'Net Income',    v:netIncome,    Icon:DollarSign,   color:netIncome>=0?'#16A34A':'#DC2626', bg:netIncome>=0?'rgba(22,163,74,0.08)':'rgba(232,112,125,0.09)', accent:netIncome>=0?'rgba(22,163,74,0.5)':'rgba(232,112,125,0.5)'},
              ].map(({label,v,Icon,color,bg,accent})=>(
                <div key={label} style={{...CARD, padding:'1.75rem', position:'relative', overflow:'hidden'}}>
                  <div style={{position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg, ${accent}, transparent)`}}/>
                  <div style={{position:'absolute', right:'-18px', bottom:'-18px', width:'90px', height:'90px', borderRadius:'50%', background:bg, pointerEvents:'none'}}/>
                  <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem'}}>
                    <span style={{fontFamily:F_MONO, fontSize:'0.72rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', fontWeight:700, lineHeight:1.4}}>{label}</span>
                    <div style={{width:'40px', height:'40px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', background:bg, border:`1px solid ${accent}`, flexShrink:0}}>
                      <Icon size={18} style={{color}}/>
                    </div>
                  </div>
                  <p className="admin-fin-num" style={{fontFamily:F_NUM, fontWeight:800, fontSize:'2.2rem', color, lineHeight:1, letterSpacing:'-0.03em'}}>{fmtPHP(v)}</p>
                  <p style={{fontFamily:F_MONO, fontSize:'0.62rem', color:'var(--text-faint)', marginTop:'0.625rem', letterSpacing:'0.1em'}}>
                    {label==='Net Income' ? (netIncome>=0?'▲ Profit':'▼ Loss') : label==='Total Revenue'?'Incoming funds':'Outgoing funds'}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts — shared filter */}
            <div style={{...CARD, padding:'1.25rem 1.5rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem'}}>
              <p style={{fontFamily:F_MONO, fontSize:'0.75rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)', fontWeight:700}}>Chart Filter</p>
              <div style={{display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center'}}>
                {/* Range dropdown */}
                <div style={{position:'relative'}}>
                  <select value={chartRange}
                    onChange={e => {
                      const v = e.target.value as ChartRange
                      setChartRange(v)
                      // Sync transaction history date filter
                      if (v === 'overall') {
                        setFinMonthFilter('all')
                      } else if (v === 'month') {
                        setFinMonthFilter(chartMonth)
                      } else {
                        setFinMonthFilter('all')
                      }
                    }}
                    className="input-luxury"
                    style={{paddingTop:'0.35rem', paddingBottom:'0.35rem', paddingRight:'2rem', paddingLeft:'0.75rem', fontSize:'0.8rem', appearance:'none', cursor:'pointer', minWidth:'160px', fontFamily:F_MONO, letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:600}}>
                    <option value="overall">Overall (All Time)</option>
                    <option value="1w">Last 1 Week</option>
                    <option value="2w">Last 2 Weeks</option>
                    <option value="3w">Last 3 Weeks</option>
                    <option value="month">By Month</option>
                  </select>
                  <ChevronDown size={12} style={{position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                </div>
                {/* Month selector — only shown when month mode */}
                {chartRange==='month' && (
                  <div style={{position:'relative'}}>
                    <select value={chartMonth} onChange={e => {
                      setChartMonth(e.target.value)
                      setFinMonthFilter(e.target.value)
                    }}
                      className="input-luxury" style={{paddingTop:'0.35rem', paddingBottom:'0.35rem', paddingRight:'2rem', paddingLeft:'0.75rem', fontSize:'0.8rem', appearance:'none', cursor:'pointer', minWidth:'140px'}}>
                      {monthOptions.length===0
                        ? <option value={chartMonth}>{format(parseISO(chartMonth+'-01'),'MMMM yyyy')}</option>
                        : monthOptions.map(m=><option key={m} value={m}>{format(parseISO(m+'-01'),'MMMM yyyy')}</option>)
                      }
                    </select>
                    <ChevronDown size={12} style={{position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-chart-grid">
              <div style={{...CARD, padding:'1.75rem', position:'relative', overflow:'hidden'}}>
                <div style={{position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, var(--gold), transparent)'}}/>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem'}}>
                  <p style={{fontFamily:F_MONO, fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)', fontWeight:700}}>Revenue vs Expense</p>
                  <span style={{fontFamily:F_MONO, fontSize:'0.6rem', color:'var(--text-faint)', letterSpacing:'0.08em', textTransform:'uppercase', background:'var(--bg-raised)', padding:'0.2rem 0.6rem', borderRadius:'4px', border:'1px solid var(--border)'}}>Line</span>
                </div>
                {sharedChartData.length===0
                  ? <p style={{textAlign:'center', color:'var(--text-faint)', fontSize:'0.95rem', padding:'3.5rem 0', fontFamily:F_BODY}}>No data for this period</p>
                  : <CustomLineChart data={sharedChartData} fmtPHP={fmtPHP} isDark={isDark}/>
                }
              </div>
              <div style={{...CARD, padding:'1.75rem', position:'relative', overflow:'hidden'}}>
                <div style={{position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, var(--gold), transparent)'}}/>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem'}}>
                  <p style={{fontFamily:F_MONO, fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)', fontWeight:700}}>Daily Comparison</p>
                  <span style={{fontFamily:F_MONO, fontSize:'0.6rem', color:'var(--text-faint)', letterSpacing:'0.08em', textTransform:'uppercase', background:'var(--bg-raised)', padding:'0.2rem 0.6rem', borderRadius:'4px', border:'1px solid var(--border)'}}>Bar</span>
                </div>
                {sharedChartData.length===0
                  ? <p style={{textAlign:'center', color:'var(--text-faint)', fontSize:'0.95rem', padding:'3.5rem 0', fontFamily:F_BODY}}>No data for this period</p>
                  : <CustomBarChart data={sharedChartData} fmtPHP={fmtPHP} isDark={isDark}/>
                }
              </div>
            </div>

            {/* Add Record + Transaction History */}
            <div className="admin-bottom-grid">
              {/* Form */}
              <div style={{...CARD, padding:'1.75rem', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden'}}>
                <div style={{position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, var(--gold), transparent)'}}/>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'1.5rem'}}>
                  <div style={{width:'32px', height:'32px', borderRadius:'8px', background:'var(--gold-pale)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <Plus size={15} style={{color:'var(--gold)'}}/>
                  </div>
                  <p style={{fontFamily:F_MONO, fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)', fontWeight:700}}>Add Record</p>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:'1.125rem'}}>
                  {/* Date */}
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
                          onClick={()=>{setFinForm(p=>({...p,type:t,client_name:'',client_issue:'',appointment_type:'Walk-in'})); setClientMode('dropdown')}}
                          style={{flex:1, padding:'0.65rem', borderRadius:'8px', fontFamily:F_MONO, fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s', background:finForm.type===t?(t==='revenue'?'rgba(22,163,74,0.15)':'rgba(232,112,125,0.14)'):'var(--bg-raised)', color:finForm.type===t?(t==='revenue'?'#16A34A':'#DC2626'):'var(--text-muted)', border:`1px solid ${finForm.type===t?(t==='revenue'?'rgba(22,163,74,0.3)':'rgba(232,112,125,0.35)'):'var(--border)'}`}}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Appointment Type — Revenue only: controls both mode AND client input */}
                  {finForm.type==='revenue'&&(
                    <>
                      <div>
                        <label style={LBL}>Appointment Type</label>
                        <div style={{display:'flex', gap:'8px'}}>
                          {(['Online','Walk-in'] as const).map(t=>(
                            <button key={t} type="button"
                              onClick={()=>{
                                setFinForm(p=>({...p, appointment_type:t, client_name:'', client_issue:''}))
                                setClientMode(t==='Online' ? 'dropdown' : 'manual')
                                setIssueManual(false)
                              }}
                              style={{flex:1, padding:'0.65rem', borderRadius:'8px', fontFamily:F_MONO, fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s',
                                background: finForm.appointment_type===t
                                  ? (t==='Online' ? 'rgba(59,130,246,0.15)' : 'rgba(201,168,76,0.15)')
                                  : 'var(--bg-raised)',
                                color: finForm.appointment_type===t
                                  ? (t==='Online' ? '#1D4ED8' : '#B8922A')
                                  : 'var(--text-muted)',
                                border: `1px solid ${finForm.appointment_type===t
                                  ? (t==='Online' ? 'rgba(59,130,246,0.3)' : 'rgba(201,168,76,0.3)')
                                  : 'var(--border)'}`,
                              }}>
                              {t==='Online' ? '🌐 Online' : '🚶 Walk-in'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Client Name — changes based on appointment type */}
                      <div>
                        <label style={LBL}>Client Name</label>
                        {finForm.appointment_type==='Online' ? (
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
                          <input type="text" placeholder="e.g. Juan Dela Cruz"
                            value={finForm.client_name}
                            onChange={e=>setFinForm(p=>({...p, client_name:e.target.value}))}
                            className="input-luxury" style={{fontSize:'0.95rem'}}/>
                        )}
                      </div>

                      <div>
                        <label style={LBL}>Appointment / Issue Type</label>
                        {finForm.appointment_type==='Online' ? (
                          <input type="text" value={finForm.client_issue} readOnly placeholder="Auto-filled from appointment…"
                            className="input-luxury" style={{fontSize:'0.95rem', opacity: finForm.client_issue?1:0.6, cursor:'default'}}/>
                        ) : (
                          <div>
                            {!issueManual ? (
                              <div style={{position:'relative'}}>
                                <select
                                  value={finForm.client_issue}
                                  onChange={e => setFinForm(p=>({...p, client_issue: e.target.value}))}
                                  className="input-luxury"
                                  style={{fontSize:'0.95rem', paddingRight:'2.25rem', appearance:'none', cursor:'pointer', width:'100%'}}
                                >
                                  <option value="">— Select issue type —</option>
                                  {ISSUE_GROUPS.map(g => (
                                    <optgroup key={g} label={g}>
                                      {ISSUE_TYPES.filter(i => i.group === g).map(item => (
                                        <option key={item.label} value={item.label}>{item.label}</option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                                <ChevronDown size={13} style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                              </div>
                            ) : (
                              <input type="text" placeholder="e.g. Property Dispute, Notarization…"
                                value={finForm.client_issue}
                                onChange={e=>setFinForm(p=>({...p, client_issue:e.target.value}))}
                                className="input-luxury" style={{fontSize:'0.95rem'}}/>
                            )}
                            <button type="button"
                              onClick={() => { setIssueManual(v => !v); setFinForm(p=>({...p, client_issue:''})) }}
                              style={{marginTop:'7px', background:'none', border:'none', cursor:'pointer', fontFamily:F_BODY, fontSize:'0.82rem', fontWeight:600, color:'var(--gold)', textDecoration:'underline', padding:0, display:'flex', alignItems:'center', gap:'4px'}}>
                              {issueManual ? '← Back to dropdown' : '✎ Type manually instead'}
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Amount */}
                  <div>
                    <label style={LBL}>Amount (₱)</label>
                    <input type="number" min="0" step="0.01" placeholder="e.g. 1500.00"
                      value={finForm.amount} onChange={e=>setFinForm(p=>({...p,amount:e.target.value}))}
                      className="input-luxury" style={{fontSize:'0.95rem'}}/>
                  </div>

                  {/* Invoice */}
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

                  {/* Description — Expense only */}
                  {finForm.type==='expense'&&(
                    <div>
                      <label style={LBL}>Description</label>
                      <input type="text" placeholder="Brief description…"
                        value={finForm.description} onChange={e=>setFinForm(p=>({...p,description:e.target.value}))}
                        className="input-luxury" style={{fontSize:'0.95rem'}}/>
                    </div>
                  )}

                  <button onClick={()=>{
                    if (!finForm.record_date||!finForm.amount) { toast.error('Please fill in date and amount.'); return }
                    setShowConfirm(true)
                  }} className="btn-gold" style={{width:'100%', justifyContent:'center', fontSize:'0.9rem', padding:'0.85rem', marginTop:'0.25rem'}}>
                    <Plus size={15}/> Review & Save
                  </button>
                </div>
              </div>

              {/* Transaction History */}
              <div style={{...CARD, display:'flex', flexDirection:'column', minHeight:0, flex:1, borderTop:'3px solid var(--gold)'}}>
                <div style={{padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', flexShrink:0}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.75rem', marginBottom:'0.875rem', flexWrap:'wrap'}}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <div style={{width:'32px', height:'32px', borderRadius:'8px', background:'var(--gold-pale)', border:'1px solid var(--gold-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                        <Filter size={13} style={{color:'var(--gold)'}}/>
                      </div>
                      <p style={{fontFamily:F_MONO, fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)', fontWeight:700}}>Transaction History</p>
                    </div>
                    <button onClick={exportFinCSV} style={{display:'flex', alignItems:'center', gap:'6px', padding:'0.5rem 0.75rem', borderRadius:'8px', fontFamily:F_BODY, fontSize:'0.82rem', fontWeight:600, cursor:'pointer', background:'var(--gold)', border:'none', color:'#fff', boxShadow:'0 2px 8px rgba(184,146,42,0.3)', transition:'opacity 0.2s', flexShrink:0, whiteSpace:'nowrap'}}
                      onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.opacity='0.85'}
                      onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.opacity='1'}>
                      <Download size={13}/> <span className="admin-brand-subtitle">Export .xlsx</span>
                    </button>
                  </div>
                  <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                    <div style={{position:'relative'}}>
                      <Filter size={12} style={{position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)'}}/>
                      <select value={finTypeFilter} onChange={e=>{setFinTypeFilter(e.target.value as 'revenue'|'expense'); setRevPage(1); setExpPage(1)}}
                        className="input-luxury" style={{paddingLeft:'28px', paddingTop:'0.45rem', paddingBottom:'0.45rem', fontSize:'0.85rem', paddingRight:'2rem', appearance:'none', cursor:'pointer', minWidth:'145px'}}>
                        <option value="revenue">Revenue</option>
                        <option value="expense">Expense</option>
                      </select>
                      <ChevronDown size={12} style={{position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                    </div>
                    <div style={{position:'relative'}}>
                      <Calendar size={12} style={{position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)'}}/>
                      <select value={finMonthFilter} onChange={e => {
                        const v = e.target.value
                        setFinMonthFilter(v)
                        setRevPage(1); setExpPage(1)
                        // Sync chart filter
                        if (v === 'all') {
                          setChartRange('overall')
                        } else {
                          setChartRange('month')
                          setChartMonth(v)
                        }
                      }}
                        className="input-luxury" style={{paddingLeft:'28px', paddingTop:'0.45rem', paddingBottom:'0.45rem', fontSize:'0.85rem', paddingRight:'2rem', appearance:'none', cursor:'pointer', minWidth:'175px'}}>
                        <option value="all">All Months</option>
                        {monthOptions.map(m=>(
                          <option key={m} value={m}>{format(parseISO(m+'-01'),'MMMM yyyy')}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} style={{position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-faint)'}}/>
                    </div>
                    {/* Invoice search */}
                    <div style={{position:'relative'}}>
                      <Search size={12} style={{position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', color:'var(--text-faint)'}}/>
                      <input
                        type="text"
                        placeholder="Search invoice no…"
                        value={transSearch}
                        onChange={e=>{ setTransSearch(e.target.value); setRevPage(1); setExpPage(1) }}
                        className="input-luxury"
                        style={{paddingLeft:'28px', paddingTop:'0.45rem', paddingBottom:'0.45rem', fontSize:'0.85rem', minWidth:'185px'}}
                      />
                      {transSearch && (
                        <button type="button" onClick={()=>{ setTransSearch(''); setRevPage(1); setExpPage(1) }}
                          style={{position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-faint)', display:'flex', alignItems:'center'}}>
                          <X size={12}/>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Scrollable tables area ── */}
                <div style={{overflowY:'auto', flex:1, minHeight:0}}>
                  {filteredRecords.length===0 ? (
                    <p style={{textAlign:'center', color:'var(--text-faint)', fontSize:'0.95rem', padding:'3.5rem', fontFamily:F_BODY}}>No records found</p>
                  ) : (()=>{
                    const revenues = filteredRecords.filter(r=>r.type==='revenue')
                    const expenses = filteredRecords.filter(r=>r.type==='expense')

                    // Revenue columns: Date, Amount, Appt Type, Invoice, Client, Issue, Payment
                    // Expense columns: Date, Amount, Invoice, Payment, Description
                    const RevTable = ({rows}: {rows: FinancialRecord[]}) => {
                      const pages = Math.ceil(rows.length/ROWS_PER_PAGE)
                      const safePg = Math.min(revPage, Math.max(1, pages))
                      const pageRows = rows.slice((safePg-1)*ROWS_PER_PAGE, safePg*ROWS_PER_PAGE)
                      const totalRevAmt = rows.reduce((s,r)=>s+r.amount,0)
                      return (
                      <div style={{overflowX:'auto'}}>
                        <table style={{width:'100%', minWidth:'700px', borderCollapse:'collapse'}}>
                          <thead style={{position:'sticky', top:0, zIndex:1}}>
                            <tr style={{background:'rgba(22,163,74,0.08)', borderBottom:'2px solid rgba(22,163,74,0.2)'}}>
                              {['Date','Amount','Appt Type','Invoice','Client','Issue','Payment'].map(h=>(
                                <th key={h} style={{textAlign:'left', padding:'0.7rem 1rem', fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#15803D', fontWeight:700, whiteSpace:'nowrap'}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pageRows.map(r=>{
                              const x=r as FinancialRecord&{invoice_number?:string;client_name?:string;client_issue?:string;payment_method?:string;appointment_type?:string}
                              const apptType = x.appointment_type || (x.client_name ? 'Walk-in' : '—')
                              return (
                                <tr key={r.id} style={{borderBottom:'1px solid var(--border)'}}
                                  onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='rgba(22,163,74,0.04)'}
                                  onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=''}>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_NUM, fontSize:'0.88rem', color:'var(--text-secondary)', whiteSpace:'nowrap'}}>{format(parseISO(r.record_date),'MMM d, yyyy')}</td>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_NUM, fontSize:'0.9rem', fontWeight:600, color:'#16A34A', whiteSpace:'nowrap'}}>{fmtPHP(r.amount)}</td>
                                  <td style={{padding:'0.8rem 1rem'}}>
                                    <span style={{
                                      fontFamily:F_MONO, fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase',
                                      padding:'0.2rem 0.6rem', borderRadius:'5px', whiteSpace:'nowrap',
                                      background: apptType==='Online' ? 'rgba(59,130,246,0.1)' : apptType==='Walk-in' ? 'rgba(201,168,76,0.12)' : 'var(--bg-raised)',
                                      color:      apptType==='Online' ? '#1D4ED8'              : apptType==='Walk-in' ? '#B8922A'                : 'var(--text-faint)',
                                      border:     apptType==='Online' ? '1px solid rgba(59,130,246,0.25)' : apptType==='Walk-in' ? '1px solid rgba(201,168,76,0.3)' : '1px solid var(--border)',
                                    }}>{apptType}</span>
                                  </td>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_MONO, fontSize:'0.8rem', color:'var(--text-muted)'}}>{x.invoice_number||'—'}</td>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_BODY, fontSize:'0.88rem', color:'var(--text-secondary)'}}>{x.client_name||'—'}</td>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_BODY, fontSize:'0.85rem', color:'var(--text-muted)', maxWidth:'130px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{x.client_issue||'—'}</td>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_BODY, fontSize:'0.85rem', color:'var(--text-muted)'}}>{x.payment_method||'—'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{background:'rgba(22,163,74,0.06)', borderTop:'2px solid rgba(22,163,74,0.2)'}}>
                              <td style={{padding:'0.75rem 1rem', fontFamily:F_MONO, fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#15803D', fontWeight:700}}>Total</td>
                              <td style={{padding:'0.75rem 1rem', fontFamily:F_NUM, fontSize:'0.95rem', fontWeight:800, color:'#16A34A'}}>{fmtPHP(totalRevAmt)}</td>
                              <td colSpan={5}/>
                            </tr>
                          </tfoot>
                        </table>
                        {pages>1&&(
                          <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'0.75rem 1rem',borderTop:'1px solid var(--border)',flexWrap:'wrap'}}>
                            <button onClick={()=>setRevPage(p=>Math.max(1,p-1))} disabled={safePg===1} style={{padding:'0.3rem 0.6rem',borderRadius:'6px',fontFamily:F_MONO,fontSize:'0.72rem',fontWeight:700,cursor:safePg===1?'not-allowed':'pointer',border:`1px solid ${safePg===1?'var(--border)':'#16A34A'}`,background:'transparent',color:safePg===1?'var(--text-faint)':'#16A34A',opacity:safePg===1?0.4:1}}>«</button>
                            {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                              <button key={p} onClick={()=>setRevPage(p)} style={{width:'32px',height:'32px',borderRadius:'6px',fontFamily:F_MONO,fontSize:'0.75rem',fontWeight:700,cursor:'pointer',border:`1px solid ${safePg===p?'#16A34A':'var(--border)'}`,background:safePg===p?'#16A34A':'transparent',color:safePg===p?'#fff':'var(--text-muted)',transition:'all 0.15s'}}>{p}</button>
                            ))}
                            <button onClick={()=>setRevPage(p=>Math.min(pages,p+1))} disabled={safePg===pages} style={{padding:'0.3rem 0.65rem',borderRadius:'6px',fontFamily:F_MONO,fontSize:'0.72rem',fontWeight:700,cursor:safePg===pages?'not-allowed':'pointer',border:`1px solid ${safePg===pages?'var(--border)':'#16A34A'}`,background:'transparent',color:safePg===pages?'var(--text-faint)':'#16A34A',opacity:safePg===pages?0.4:1,letterSpacing:'0.04em'}}>NEXT »</button>
                            <span style={{fontFamily:F_MONO,fontSize:'0.62rem',color:'var(--text-faint)',marginLeft:'6px',letterSpacing:'0.08em'}}>{((safePg-1)*ROWS_PER_PAGE)+1}–{Math.min(safePg*ROWS_PER_PAGE,rows.length)} of {rows.length}</span>
                          </div>
                        )}
                      </div>
                      )
                    }

                    const ExpTable = ({rows}: {rows: FinancialRecord[]}) => {
                      const pages = Math.ceil(rows.length/ROWS_PER_PAGE)
                      const safePg = Math.min(expPage, Math.max(1, pages))
                      const pageRows = rows.slice((safePg-1)*ROWS_PER_PAGE, safePg*ROWS_PER_PAGE)
                      const totalExp = rows.reduce((s,r)=>s+r.amount,0)
                      return (
                      <div style={{overflowX:'auto'}}>
                        <table style={{width:'100%', minWidth:'560px', borderCollapse:'collapse'}}>
                          <thead style={{position:'sticky', top:0, zIndex:1}}>
                            <tr style={{background:'rgba(232,112,125,0.08)', borderBottom:'2px solid rgba(232,112,125,0.2)'}}>
                              {['Date','Amount','Invoice','Payment','Description'].map(h=>(
                                <th key={h} style={{textAlign:'left', padding:'0.7rem 1rem', fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#B91C1C', fontWeight:700, whiteSpace:'nowrap'}}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pageRows.map(r=>{
                              const x=r as FinancialRecord&{payment_method?:string;invoice_number?:string}
                              return (
                                <tr key={r.id} style={{borderBottom:'1px solid var(--border)'}}
                                  onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='rgba(232,112,125,0.04)'}
                                  onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=''}>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_NUM, fontSize:'0.88rem', color:'var(--text-secondary)', whiteSpace:'nowrap'}}>{format(parseISO(r.record_date),'MMM d, yyyy')}</td>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_NUM, fontSize:'0.9rem', fontWeight:600, color:'#DC2626', whiteSpace:'nowrap'}}>{fmtPHP(r.amount)}</td>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_MONO, fontSize:'0.8rem', color:'var(--text-muted)'}}>{x.invoice_number||'—'}</td>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_BODY, fontSize:'0.85rem', color:'var(--text-muted)'}}>{x.payment_method||'—'}</td>
                                  <td style={{padding:'0.8rem 1rem', fontFamily:F_BODY, fontSize:'0.85rem', color:'var(--text-muted)', minWidth:'130px', maxWidth:'220px', whiteSpace:'normal', wordBreak:'break-word', lineHeight:1.5}}>{r.description||'—'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{background:'rgba(232,112,125,0.06)', borderTop:'2px solid rgba(232,112,125,0.2)'}}>
                              <td style={{padding:'0.75rem 1rem', fontFamily:F_MONO, fontSize:'0.72rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#B91C1C', fontWeight:700}}>Total</td>
                              <td style={{padding:'0.75rem 1rem', fontFamily:F_NUM, fontSize:'0.95rem', fontWeight:800, color:'#DC2626'}}>{fmtPHP(totalExp)}</td>
                              <td colSpan={3}/>
                            </tr>
                          </tfoot>
                        </table>
                        {/* Expense Pagination */}
                        {pages>1&&(
                          <div style={{display:'flex',alignItems:'center',gap:'4px',padding:'0.75rem 1rem',borderTop:'1px solid var(--border)',flexWrap:'wrap'}}>
                            <button onClick={()=>setExpPage(p=>Math.max(1,p-1))} disabled={safePg===1} style={{padding:'0.3rem 0.6rem',borderRadius:'6px',fontFamily:F_MONO,fontSize:'0.72rem',fontWeight:700,cursor:safePg===1?'not-allowed':'pointer',border:`1px solid ${safePg===1?'var(--border)':'#DC2626'}`,background:'transparent',color:safePg===1?'var(--text-faint)':'#DC2626',opacity:safePg===1?0.4:1}}>«</button>
                            {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                              <button key={p} onClick={()=>setExpPage(p)} style={{width:'32px',height:'32px',borderRadius:'6px',fontFamily:F_MONO,fontSize:'0.75rem',fontWeight:700,cursor:'pointer',border:`1px solid ${safePg===p?'#DC2626':'var(--border)'}`,background:safePg===p?'#DC2626':'transparent',color:safePg===p?'#fff':'var(--text-muted)',transition:'all 0.15s'}}>{p}</button>
                            ))}
                            <button onClick={()=>setExpPage(p=>Math.min(pages,p+1))} disabled={safePg===pages} style={{padding:'0.3rem 0.65rem',borderRadius:'6px',fontFamily:F_MONO,fontSize:'0.72rem',fontWeight:700,cursor:safePg===pages?'not-allowed':'pointer',border:`1px solid ${safePg===pages?'var(--border)':'#DC2626'}`,background:'transparent',color:safePg===pages?'var(--text-faint)':'#DC2626',opacity:safePg===pages?0.4:1,letterSpacing:'0.04em'}}>NEXT »</button>
                            <span style={{fontFamily:F_MONO,fontSize:'0.62rem',color:'var(--text-faint)',marginLeft:'6px',letterSpacing:'0.08em'}}>{((safePg-1)*ROWS_PER_PAGE)+1}–{Math.min(safePg*ROWS_PER_PAGE,rows.length)} of {rows.length}</span>
                          </div>
                        )}
                      </div>
                      )
                    }

                    return (
                      <>
                        {/* ── REVENUE TABLE ── */}
                        {finTypeFilter==='revenue' && revenues.length > 0 && (
                          <div>
                            <div style={{display:'flex', alignItems:'center', gap:'8px', padding:'0.75rem 1rem', background:'rgba(22,163,74,0.06)', borderBottom:'1px solid rgba(22,163,74,0.15)'}}>
                              <TrendingUp size={13} style={{color:'#16A34A', flexShrink:0}}/>
                              <span style={{fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#16A34A', fontWeight:700}}>Revenue — {revenues.length} record{revenues.length!==1?'s':''}</span>
                            </div>
                            <RevTable rows={revenues}/>
                          </div>
                        )}
                        {finTypeFilter==='revenue' && revenues.length===0 && (
                          <p style={{textAlign:'center', color:'var(--text-faint)', fontSize:'0.88rem', padding:'2rem', fontFamily:F_BODY}}>No revenue records</p>
                        )}

                        {/* ── EXPENSE TABLE ── */}
                        {finTypeFilter==='expense' && expenses.length > 0 && (
                          <div>
                            <div style={{display:'flex', alignItems:'center', gap:'8px', padding:'0.75rem 1rem', background:'rgba(232,112,125,0.06)', borderBottom:'1px solid rgba(232,112,125,0.15)'}}>
                              <TrendingDown size={13} style={{color:'#DC2626', flexShrink:0}}/>
                              <span style={{fontFamily:F_MONO, fontSize:'0.68rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#DC2626', fontWeight:700}}>Expense — {expenses.length} record{expenses.length!==1?'s':''}</span>
                            </div>
                            <ExpTable rows={expenses}/>
                          </div>
                        )}
                        {finTypeFilter==='expense' && expenses.length===0 && (
                          <p style={{textAlign:'center', color:'var(--text-faint)', fontSize:'0.88rem', padding:'2rem', fontFamily:F_BODY}}>No expense records</p>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ CALENDAR DAY MODAL ══ */}
      {calModal&&(
        <div style={{position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setCalModal(null)}}>
          <div className="admin-modal-inner" style={{...CARD, width:'100%', maxWidth:'520px', maxHeight:'85vh', overflowY:'auto', border:'1px solid var(--border-strong)'}}>
            <div style={{position:'sticky', top:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.125rem 1.5rem', borderBottom:'1px solid var(--border)', background:'var(--bg-surface)', zIndex:1}}>
              <div>
                <p style={{fontFamily:F_BODY, fontWeight:600, fontSize:'1.1rem', color:'var(--text-primary)'}}>
                  {format(parseISO(calModal.date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p style={{fontFamily:F_MONO, fontSize:'0.65rem', color:'var(--text-faint)', marginTop:'2px', letterSpacing:'0.08em'}}>
                  {calModal.appts.length} APPOINTMENT{calModal.appts.length!==1?'S':''}
                </p>
              </div>
              <button onClick={()=>setCalModal(null)} style={{color:'var(--text-muted)', cursor:'pointer', background:'none', border:'none'}}><X size={18}/></button>
            </div>
            <div style={{padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.75rem'}}>
              {calModal.appts.map(a=>{
                const ax = a as Appointment & Record<string,unknown>
                return (
                  <div key={a.id} style={{...CARD, padding:'1rem 1.25rem', borderLeft:`3px solid ${SS[a.status].color}`}}>
                    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.75rem', marginBottom:'0.5rem'}}>
                      <div>
                        <p style={{fontFamily:F_BODY, fontWeight:600, fontSize:'0.95rem', color:'var(--text-primary)'}}>{a.first_name} {a.last_name}</p>
                        <p style={{fontFamily:F_BODY, fontSize:'0.8rem', color:'var(--text-faint)', marginTop:'2px'}}>{ax.contact_number as string || ax.email as string || '—'}</p>
                      </div>
                      <Badge s={a.status}/>
                    </div>
                    <div style={{display:'flex', gap:'1rem', flexWrap:'wrap'}}>
                      <div>
                        <p style={{fontFamily:F_MONO, fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-faint)', marginBottom:'2px'}}>Issue</p>
                        <p style={{fontFamily:F_BODY, fontSize:'0.85rem', color:'var(--text-secondary)'}}>{a.issue_type}</p>
                      </div>
                      {ax.appointment_time && (
                        <div>
                          <p style={{fontFamily:F_MONO, fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-faint)', marginBottom:'2px'}}>Time</p>
                          <p style={{fontFamily:F_BODY, fontSize:'0.85rem', color:'var(--text-secondary)'}}>{formatTime(ax.appointment_time as string)}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={()=>{ setCalModal(null); setSelected(a); setNotes(a.notes||''); setDateVal((a as Record<string,unknown>).appointment_date as string||'') }}
                      style={{marginTop:'0.75rem', display:'flex', alignItems:'center', gap:'5px', padding:'0.35rem 0.8rem', borderRadius:'7px', fontFamily:F_BODY, fontSize:'0.82rem', fontWeight:500, cursor:'pointer', background:'var(--gold-pale)', color:'var(--gold)', border:'1px solid var(--gold-border)'}}>
                      <Eye size={12}/> View Full Details
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ APPOINTMENT MODAL ══ */}
      {selected&&(
        <div style={{position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)'}}
          onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
          <div className="admin-modal-inner" style={{...CARD, width:'100%', maxWidth:'540px', maxHeight:'90vh', overflowY:'auto', border:'1px solid var(--border-strong)'}}>
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
                  ['Preferred Time', formatTime((selected as Record<string,unknown>).appointment_time as string||''), false],
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
          <div className="admin-modal-inner" style={{...CARD, width:'100%', maxWidth:'500px', border:'1px solid var(--border-strong)'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.75rem', borderBottom:'1px solid var(--border)'}}>
              <p style={{fontFamily:F_BODY, fontWeight:600, fontSize:'1.15rem', color:'var(--text-primary)'}}>Message</p>
              <button onClick={()=>setSelMsg(null)} style={{color:'var(--text-muted)', cursor:'pointer', background:'none', border:'none'}}><X size={18}/></button>
            </div>
            <div style={{padding:'1.75rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem'}}>
                <div><p style={LBL}>From</p><p style={{fontSize:'0.95rem', color:'var(--text-primary)', fontWeight:600, fontFamily:F_BODY}}>{selMsg.name}</p></div>
                <div><p style={LBL}>Email</p><a href={`mailto:${selMsg.email}`} style={{fontSize:'0.95rem', color:'var(--gold)', fontWeight:500, fontFamily:F_BODY}}>{selMsg.email}</a></div>
                {selMsg.contact_number && (
                  <div style={{gridColumn:'1/-1'}}>
                    <p style={LBL}>Contact Number</p>
                    <a href={`tel:${selMsg.contact_number.replace(/\s/g,'')}`} style={{fontSize:'0.95rem', color:'var(--gold)', fontWeight:500, fontFamily:F_BODY}}>
                      {selMsg.contact_number}
                    </a>
                  </div>
                )}
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
                  ['Amount',     `₱${parseFloat(finForm.amount||'0').toLocaleString('en-PH',{minimumFractionDigits:2})}`],
                  ['Invoice No.',finForm.invoice_number||'—'],
                  ...(finForm.type==='revenue'?[
                    ['Appt Type', finForm.appointment_type],
                    ['Client',finForm.client_name||'—'],
                    ['Issue',finForm.client_issue||'—'],
                  ]:[]),
                  ['Payment',    finForm.payment_method],
                  ...(finForm.type==='expense'&&finForm.description?[['Description',finForm.description]]:[]),
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