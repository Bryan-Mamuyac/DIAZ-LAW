import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Appointment = {
  id?: string
  created_at?: string
  first_name: string
  last_name: string
  address: string
  age: number
  issue_type: string
  description?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  appointment_date?: string
  appointment_time?: string
  email?: string
  contact_number?: string
  notes?: string
}

export type ContactMessage = {
  id?: string
  created_at?: string
  name: string
  email: string
  subject: string
  message: string
  read?: boolean
}

export type FinancialRecord = {
  id?: string
  created_at?: string
  record_date: string
  type: 'revenue' | 'expense'
  category: string
  amount: number
  description: string
}
