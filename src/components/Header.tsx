'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import type { Profile } from '@/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const clientRef = useRef<SupabaseClient | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      clientRef.current = supabase

      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!cancelled) setProfile(data)
    }
    init()
    return () => { cancelled = true }
  }, [])

  async function handleSignOut() {
    if (clientRef.current) {
      await clientRef.current.auth.signOut()
    }
    router.push('/login')
    router.refresh()
  }

  if (pathname === '/login' || pathname === '/setup') return null

  const navLinks = [
    { href: '/', label: 'Tabla' },
    { href: '/predictions', label: 'Predicciones' },
    ...(profile?.is_admin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">⚽</span>
          <span className="text-emerald-400">El Fincotorneo</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-sm text-slate-400 hidden sm:block">{profile.name}</span>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-400 hover:text-slate-100 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="sm:hidden flex border-t border-slate-800">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 text-center py-2 text-xs font-medium transition-colors ${
              pathname === href
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-400'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </header>
  )
}
