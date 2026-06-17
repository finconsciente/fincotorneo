'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Match, Prediction, Stage } from '@/types'
import { STAGE_LABELS } from '@/types'

type MatchWithPrediction = Match & { prediction?: Prediction }

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isPast(dateStr: string) {
  return new Date(dateStr) < new Date()
}

function getResultLabel(pts: number | null | undefined) {
  if (pts === 5) return { label: '⭐ Exacto', cls: 'text-amber-400 bg-amber-400/10' }
  if (pts === 3) return { label: '✅ Ganador', cls: 'text-emerald-400 bg-emerald-400/10' }
  if (pts === 0) return { label: '❌ Error', cls: 'text-red-400 bg-red-400/10' }
  return null
}

function PredictionModal({
  match,
  existing,
  onClose,
  onSave,
}: {
  match: Match
  existing?: Prediction
  onClose: () => void
  onSave: (home: number, away: number) => Promise<void>
}) {
  const [home, setHome] = useState(existing?.predicted_home ?? 0)
  const [away, setAway] = useState(existing?.predicted_away ?? 0)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(home, away)
    setSaving(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-lg mb-1">Tu predicción</h3>
        <p className="text-slate-400 text-sm mb-6">
          {match.home_flag} {match.home_team} vs {match.away_team} {match.away_flag}
        </p>

        <div className="flex items-center gap-4 justify-center mb-6">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-2">{match.home_team}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHome(Math.max(0, home - 1))}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xl font-bold transition-colors"
              >
                −
              </button>
              <span className="text-3xl font-bold w-8 text-center">{home}</span>
              <button
                onClick={() => setHome(home + 1)}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xl font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <span className="text-slate-500 text-xl font-bold">–</span>

          <div className="text-center">
            <p className="text-xs text-slate-500 mb-2">{match.away_team}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAway(Math.max(0, away - 1))}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xl font-bold transition-colors"
              >
                −
              </button>
              <span className="text-3xl font-bold w-8 text-center">{away}</span>
              <button
                onClick={() => setAway(away + 1)}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-xl font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
          >
            {saving ? 'Guardando...' : existing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MatchCard({
  match,
  onPredict,
}: {
  match: MatchWithPrediction
  onPredict: (m: Match) => void
}) {
  const past = isPast(match.match_date)
  const pred = match.prediction
  const resultLabel = getResultLabel(pred?.points)

  return (
    <div
      className={`bg-slate-900 border rounded-xl p-4 transition-colors ${
        match.is_finished ? 'border-slate-800' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Teams */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{match.home_flag}</span>
            <span className="font-semibold truncate">{match.home_team}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{match.away_flag}</span>
            <span className="font-semibold truncate">{match.away_team}</span>
          </div>
        </div>

        {/* Score / Result */}
        <div className="text-center px-4">
          {match.is_finished ? (
            <div className="text-2xl font-bold tabular-nums">
              <span>{match.home_score}</span>
              <span className="text-slate-600 mx-1">–</span>
              <span>{match.away_score}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">{formatDate(match.match_date)}</div>
          )}
          {match.group_name && (
            <div className="text-xs text-slate-600 mt-1">Grupo {match.group_name}</div>
          )}
        </div>

        {/* Prediction / Action */}
        <div className="flex-shrink-0 text-right">
          {pred ? (
            <div>
              <div className="text-sm font-medium tabular-nums text-slate-300">
                {pred.predicted_home} – {pred.predicted_away}
              </div>
              {resultLabel ? (
                <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${resultLabel.cls}`}>
                  {resultLabel.label} · {pred.points}pts
                </span>
              ) : !past ? (
                <button
                  onClick={() => onPredict(match)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 block"
                >
                  Editar
                </button>
              ) : (
                <span className="text-xs text-slate-600 mt-1 block">Pendiente</span>
              )}
            </div>
          ) : past ? (
            <span className="text-xs text-red-400/60">Sin predicción</span>
          ) : (
            <button
              onClick={() => onPredict(match)}
              className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Predecir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const STAGE_ORDER: Stage[] = ['group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final']

export default function PredictionsPage() {
  const supabase = createClient()
  const [matches, setMatches] = useState<MatchWithPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeStage, setActiveStage] = useState<Stage | 'all'>('all')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: matchData }, { data: predData }] = await Promise.all([
        supabase.from('matches').select('*').order('match_date', { ascending: true }),
        supabase.from('predictions').select('*').eq('user_id', user.id),
      ])

      const predMap = new Map((predData ?? []).map((p) => [p.match_id, p]))
      const combined = (matchData ?? []).map((m) => ({
        ...m,
        prediction: predMap.get(m.id),
      }))
      setMatches(combined)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(home: number, away: number) {
    if (!activeMatch || !userId) return

    const existing = matches.find((m) => m.id === activeMatch.id)?.prediction

    if (existing) {
      await supabase
        .from('predictions')
        .update({ predicted_home: home, predicted_away: away, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('predictions').insert({
        user_id: userId,
        match_id: activeMatch.id,
        predicted_home: home,
        predicted_away: away,
      })
    }

    setMatches((prev) =>
      prev.map((m) =>
        m.id === activeMatch.id
          ? {
              ...m,
              prediction: {
                ...(existing ?? {
                  id: '',
                  user_id: userId,
                  match_id: activeMatch.id,
                  created_at: new Date().toISOString(),
                }),
                predicted_home: home,
                predicted_away: away,
                updated_at: new Date().toISOString(),
                points: existing?.points ?? null,
              } as Prediction,
            }
          : m
      )
    )
  }

  const stages = STAGE_ORDER.filter((s) => matches.some((m) => m.stage === s))

  const filtered =
    activeStage === 'all' ? matches : matches.filter((m) => m.stage === activeStage)

  const grouped = STAGE_ORDER.reduce<Record<Stage, MatchWithPrediction[]>>(
    (acc, stage) => {
      acc[stage] = filtered.filter((m) => m.stage === stage)
      return acc
    },
    {} as Record<Stage, MatchWithPrediction[]>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-500">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⚽</div>
          <p>Cargando partidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">⚽ Mis Predicciones</h1>
        <p className="text-slate-400 text-sm">
          Solo puedes predecir antes de que empiece el partido
        </p>
      </div>

      {/* Stage filter */}
      {stages.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setActiveStage('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeStage === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          {stages.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStage(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeStage === s
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {STAGE_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl mb-4">📅</div>
          <p>Aún no hay partidos cargados.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {STAGE_ORDER.map((stage) => {
            const stageMatches = grouped[stage]
            if (!stageMatches.length) return null
            return (
              <div key={stage}>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {STAGE_LABELS[stage]}
                </h2>
                <div className="space-y-2">
                  {stageMatches.map((m) => (
                    <MatchCard key={m.id} match={m} onPredict={setActiveMatch} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeMatch && (
        <PredictionModal
          match={activeMatch}
          existing={matches.find((m) => m.id === activeMatch.id)?.prediction}
          onClose={() => setActiveMatch(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
