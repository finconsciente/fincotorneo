export type Profile = {
  id: string
  name: string
  email: string
  is_admin: boolean
  created_at: string
}

export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final'

export type Match = {
  id: string
  home_team: string
  away_team: string
  home_flag: string
  away_flag: string
  match_date: string
  stage: Stage
  group_name: string | null
  home_score: number | null
  away_score: number | null
  is_finished: boolean
  created_at: string
}

export type Prediction = {
  id: string
  user_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  points: number | null
  created_at: string
  updated_at: string
}

export type LeaderboardEntry = {
  user_id: string
  name: string
  total_points: number
  exact_scores: number
  correct_winners: number
  total_predictions: number
}

export const STAGE_LABELS: Record<Stage, string> = {
  group: 'Fase de Grupos',
  r32: 'Ronda de 32',
  r16: 'Octavos de Final',
  qf: 'Cuartos de Final',
  sf: 'Semifinales',
  '3rd': 'Tercer Puesto',
  final: 'Final',
}
