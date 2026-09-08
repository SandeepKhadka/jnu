'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client.
 *
 * The anon key is designed to be public; every table is protected by Row Level
 * Security policies (see supabase/schema.sql). RLS is what makes this safe:
 * without it, a public anon key over a results table would expose every
 * student's marks.
 *
 * Returns null when env vars are absent, so the site still builds and runs.
 * Callers must handle the null case and show a "not configured" state.
 */

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('your-project')) return null

  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  }
  return client
}

export function isConfigured(): boolean {
  return getSupabase() !== null
}
