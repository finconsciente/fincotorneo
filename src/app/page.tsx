import { createClient } from '@/lib/supabase/server'
import type { LeaderboardEntry } from '@/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, points, profiles(name)')
    .not('points', 'is', null)

  const map = new Map<string, LeaderboardEntry>()

  for (const pred of predictions ?? []) {
    const profileRaw = pred.profiles
    const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { name: string } | null
    if (!profile) continue

    const existing = map.get(pred.user_id) ?? {
      user_id: pred.user_id,
      name: profile.name,
      total_points: 0,
      exact_scores: 0,
      correct_winners: 0,
      total_predictions: 0,
    }

    existing.total_points += pred.points ?? 0
    existing.total_predictions += 1
    if (pred.points === 5) existing.exact_scores += 1
    if (pred.points === 3) existing.correct_winners += 1

    map.set(pred.user_id, existing)
  }

  const leaderboard = Array.from(map.values()).sort(
    (a, b) => b.total_points - a.total_points || b.exact_scores - a.exact_scores
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">🏆 Tabla de Posiciones</h1>
        <p className="text-slate-400 text-sm">
          5 pts marcador exacto · 3 pts ganador correcto · 0 pts error
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-5xl mb-4">📊</div>
          <p>Aún no hay puntos registrados.</p>
          <p className="text-sm mt-1">Los puntos aparecen cuando terminen los partidos.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-6 py-4">#</th>
                <th className="text-left px-4 py-4">Nombre</th>
                <th className="text-center px-4 py-4">Pts</th>
                <th className="text-center px-4 py-4 hidden sm:table-cell">⭐ Exactos</th>
                <th className="text-center px-4 py-4 hidden sm:table-cell">✅ Ganador</th>
                <th className="text-center px-4 py-4 hidden md:table-cell">Jugadas</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => {
                const isMe = entry.user_id === user?.id
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null

                return (
                  <tr
                    key={entry.user_id}
                    className={`border-b border-slate-800/50 transition-colors ${
                      isMe ? 'bg-emerald-500/5' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      {medal ?? <span className="text-slate-600">{idx + 1}</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-semibold ${isMe ? 'text-emerald-400' : ''}`}>
                        {entry.name}
                      </span>
                      {isMe && (
                        <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                          tú
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-amber-400 font-bold text-lg">{entry.total_points}</span>
                    </td>
                    <td className="px-4 py-4 text-center text-slate-300 hidden sm:table-cell">
                      {entry.exact_scores}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-300 hidden sm:table-cell">
                      {entry.correct_winners}
                    </td>
                    <td className="px-4 py-4 text-center text-slate-500 text-sm hidden md:table-cell">
                      {entry.total_predictions}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
