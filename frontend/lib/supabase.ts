import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseConfigError =
  !url || !anonKey
    ? 'As credenciais do Supabase não foram configuradas.'
    : !/^https:\/\/[^/]+\.supabase\.co$/.test(url)
      ? 'A URL do Supabase é inválida.'
      : undefined

if (!url || !anonKey) {
  console.warn('Supabase ainda não configurado. Copie .env.local.example para .env.local e preencha as credenciais.')
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
)
