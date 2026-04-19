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
