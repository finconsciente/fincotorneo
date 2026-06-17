'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Match, Stage } from '@/types'
import { STAGE_LABELS } from '@/types'

const STAGES: Stage[] = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // New match form
  const [form, setForm] = useState({
    home_team: '',
    away_team: '',
    home_flag: '',
    away_flag: '',
    match_date: '',
    stage: 'group' as Stage,
    group_name: '',
  })
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  // Set result modal
  const [resultMatch, setResultMatch] = useState<Match | null>(null)
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) { router.push('/'); return }

      setIsAdmin(true)

      const { data } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true })

      setMatches(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAddMatch(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setAddError('')

    const { data, error } = await supabase
      .from('matches')
      .insert({
        ...form,
        group_name: form.group_name || null,
      })
      .select()
      .single()

    if (error) {
      setAddError(error.message)
    } else {
      setMatches((prev) => [...prev, data].sort((a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
      ))
      setForm({
        home_team: '',
        away_team: '',
        home_flag: '',
        away_flag: '',
        match_date: '',
        stage: 'group',
        group_name: '',
      })
    }
    setAdding(false)
  }

  async function handleSetResult() {
    if (!resultMatch) return
    setSaving(true)

    const { error } = await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        is_finished: true,
      })
      .eq('id', resultMatch.id)

    if (!error) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === resultMatch.id
            ? { ...m, home_score: homeScore, away_score: awayScore, is_finished: true }
            : m
        )
      )
      setResultMatch(null)
    }
    setSaving(false)
  }

  function openResult(match: Match) {
    setResultMatch(match)
    setHomeScore(match.home_score ?? 0)
    setAwayScore(match.away_score ?? 0)
  }

  if (loading && !isAdmin) return null

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">🔧 Panel de Admin</h1>

      {/* Add match form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Agregar partido</h2>
        <form onSubmit={handleAddMatch} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Equipo local</label>
              <input
                value={form.home_team}
                onChange={(e) => setForm({ ...form, home_team: e.target.value })}
                placeholder="Colombia"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Equipo visitante</label>
              <input
                value={form.away_team}
                onChange={(e) => setForm({ ...form, away_team: e.target.value })}
                placeholder="Brasil"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Bandera local (emoji)</label>
              <input
                value={form.home_flag}
                onChange={(e) => setForm({ ...form, home_flag: e.target.value })}
                placeholder="🇨🇴"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Bandera visitante (emoji)</label>
              <input
                value={form.away_flag}
                onChange={(e) => setForm({ ...form, away_flag: e.target.value })}
                placeholder="🇧🇷"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">Fecha y hora</label>
              <input
                type="datetime-local"
                value={form.match_date}
                onChange={(e) => setForm({ ...form, match_date: e.target.value })}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Grupo (opcional)</label>
              <input
                value={form.group_name}
                onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                placeholder="A"
                maxLength={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Etapa</label>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {addError && <p className="text-red-400 text-sm">{addError}</p>}

          <button
            type="submit"
            disabled={adding}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            {adding ? 'Agregando...' : 'Agregar partido'}
          </button>
        </form>
      </div>

      {/* Match list */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Partidos ({matches.length})</h2>
        <div className="space-y-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{match.home_flag}</span>
                  <span className="truncate">{match.home_team}</span>
                  {match.is_finished && (
                    <span className="font-bold text-emerald-400">
                      {match.home_score} – {match.away_score}
                    </span>
                  )}
                  <span>{match.away_team}</span>
                  <span>{match.away_flag}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {STAGE_LABELS[match.stage]}{match.group_name ? ` · Grupo ${match.group_name}` : ''} · {formatDate(match.match_date)}
                </p>
              </div>

              <div className="flex-shrink-0">
                {match.is_finished ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg">
                    Finalizado
                  </span>
                ) : (
                  <button
                    onClick={() => openResult(match)}
                    className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Registrar resultado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Result modal */}
      {resultMatch && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setResultMatch(null)}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-1">Registrar resultado</h3>
            <p className="text-slate-400 text-sm mb-6">
              {resultMatch.home_flag} {resultMatch.home_team} vs {resultMatch.away_team} {resultMatch.away_flag}
            </p>

            <div className="flex items-center gap-4 justify-center mb-6">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">{resultMatch.home_team}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xl font-bold transition-colors"
                  >
                    −
                  </button>
                  <span className="text-3xl font-bold w-8 text-center">{homeScore}</span>
                  <button
                    onClick={() => setHomeScore(homeScore + 1)}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xl font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <span className="text-slate-500 text-xl font-bold">–</span>

              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">{resultMatch.away_team}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xl font-bold transition-colors"
                  >
                    −
                  </button>
                  <span className="text-3xl font-bold w-8 text-center">{awayScore}</span>
                  <button
                    onClick={() => setAwayScore(awayScore + 1)}
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xl font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-amber-400/80 bg-amber-400/10 rounded-lg px-3 py-2 mb-4">
              ⚠️ Esto calculará los puntos de todos automáticamente. No se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setResultMatch(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSetResult}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                {saving ? 'Guardando...' : 'Confirmar resultado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
