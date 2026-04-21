'use client'

import { useState, useEffect } from 'react'

function getOfficeStatus() {
  // Office hours: Mon–Fri 8:00 AM – 5:00 PM Philippine Time (UTC+8)
  const now = new Date()
  // Convert to PH time
  const phOffset = 8 * 60
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  const ph = new Date(utc + phOffset * 60000)

  const day = ph.getDay() // 0=Sun, 6=Sat
  const hours = ph.getHours()
  const minutes = ph.getMinutes()
  const timeInMinutes = hours * 60 + minutes

  const openTime  = 8  * 60      // 8:00 AM
  const closeTime = 17 * 60      // 5:00 PM

  const isWeekday = day >= 1 && day <= 5
  const isWithinHours = timeInMinutes >= openTime && timeInMinutes < closeTime
  const isOpen = isWeekday && isWithinHours

  // Format current PH time
  const h = hours % 12 || 12
  const m = String(minutes).padStart(2, '0')
  const period = hours >= 12 ? 'PM' : 'AM'
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const currentDay = dayNames[day]

  return { isOpen, currentDay, currentTime: `${h}:${m} ${period}` }
}

export function OfficeStatus() {
  const [status, setStatus] = useState(getOfficeStatus())

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => setStatus(getOfficeStatus()), 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-between text-sm gap-8">
      <span style={{ color: 'var(--text-secondary)' }}>
        Right Now <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>({status.currentDay}, {status.currentTime})</span>
      </span>
      <span
        className="inline-flex items-center gap-1.5 font-semibold text-xs px-2 py-0.5 rounded-md"
        style={{
          background: status.isOpen ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${status.isOpen ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.2)'}`,
          color: status.isOpen ? '#16A34A' : '#DC2626',
        }}
      >
        <span
          style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: status.isOpen ? '#16A34A' : '#DC2626',
            display: 'inline-block',
            animation: status.isOpen ? 'pulse 2s infinite' : 'none',
          }}
        />
        {status.isOpen ? 'Open' : 'Closed'}
      </span>
    </div>
  )
}
