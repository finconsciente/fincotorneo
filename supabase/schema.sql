-- =============================================================
-- El Fincotorneo — Schema de base de datos
-- Ejecutar en el SQL Editor de Supabase
-- =============================================================

-- Tabla de perfiles (extiende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  is_admin boolean default false not null,
  created_at timestamptz default now() not null
);

-- Tabla de partidos
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  home_team text not null,
  away_team text not null,
  home_flag text default '' not null,
  away_flag text default '' not null,
  match_date timestamptz not null,
  stage text not null check (stage in ('group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final')),
  group_name text,
  home_score integer,
  away_score integer,
  is_finished boolean default false not null,
  created_at timestamptz default now() not null
);

-- Tabla de predicciones
create table if not exists public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_id uuid references public.matches(id) on delete cascade not null,
  predicted_home integer not null check (predicted_home >= 0),
  predicted_away integer not null check (predicted_away >= 0),
  points integer check (points in (0, 3, 5)),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, match_id)
);

-- =============================================================
-- Row Level Security
-- =============================================================

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

-- Profiles: todos los usuarios autenticados pueden leer
create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- Matches: todos leen, solo admins escriben
create policy "matches_select" on public.matches
  for select using (auth.role() = 'authenticated');

create policy "matches_insert" on public.matches
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "matches_update" on public.matches
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Predictions: todos leen, cada usuario gestiona las suyas
create policy "predictions_select" on public.predictions
  for select using (auth.role() = 'authenticated');

create policy "predictions_insert" on public.predictions
  for insert with check (auth.uid() = user_id);

create policy "predictions_update" on public.predictions
  for update using (auth.uid() = user_id);

-- =============================================================
-- Función para calcular puntos automáticamente
-- Se dispara cuando un partido se marca como finalizado
-- =============================================================

create or replace function calculate_prediction_points(p_match_id uuid)
returns void as $$
declare
  v_match public.matches%rowtype;
  v_pred  public.predictions%rowtype;
  v_pts   integer;
begin
  select * into v_match from public.matches where id = p_match_id;

  if not v_match.is_finished then return; end if;

  for v_pred in
    select * from public.predictions where match_id = p_match_id
  loop
    -- Marcador exacto
    if v_pred.predicted_home = v_match.home_score and
       v_pred.predicted_away = v_match.away_score then
      v_pts := 5;
    -- Ganador correcto (local)
    elsif v_match.home_score > v_match.away_score and
          v_pred.predicted_home > v_pred.predicted_away then
      v_pts := 3;
    -- Ganador correcto (visitante)
    elsif v_match.home_score < v_match.away_score and
          v_pred.predicted_home < v_pred.predicted_away then
      v_pts := 3;
    -- Empate correcto
    elsif v_match.home_score = v_match.away_score and
          v_pred.predicted_home = v_pred.predicted_away then
      v_pts := 3;
    else
      v_pts := 0;
    end if;

    update public.predictions
    set points = v_pts, updated_at = now()
    where id = v_pred.id;
  end loop;
end;
$$ language plpgsql security definer;

-- Trigger
create or replace function trigger_calculate_points()
returns trigger as $$
begin
  if new.is_finished = true and (old.is_finished = false or old.is_finished is null) then
    perform calculate_prediction_points(new.id);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_match_finished on public.matches;
create trigger on_match_finished
  after update on public.matches
  for each row
  execute function trigger_calculate_points();

-- =============================================================
-- Hacer admin al primer usuario (reemplaza el email)
-- Ejecutar después de que el usuario se registre por primera vez
-- =============================================================
-- update public.profiles set is_admin = true where email = 'tu@correo.com';
