create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  birth_date date,
  biological_sex text,
  height_cm numeric,
  current_weight_kg numeric,
  experience_level text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  alternative_name text,
  primary_muscle text not null,
  secondary_muscles text[] default '{}',
  equipment text,
  difficulty text,
  exercise_type text,
  instructions text[] default '{}',
  common_mistakes text[] default '{}',
  safety_tips text[] default '{}',
  substitutions text[] default '{}',
  image_url text,
  video_url text,
  is_active boolean default true
);

create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  days_per_week int,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table workout_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references workout_plans(id) on delete cascade,
  name text not null,
  order_index int not null,
  estimated_duration_minutes int
);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid references workout_days(id) on delete cascade,
  exercise_id uuid references exercises(id),
  order_index int not null,
  sets int not null,
  min_reps int not null,
  max_reps int not null,
  target_rir int,
  rest_seconds int,
  suggested_weight numeric,
  cadence text,
  technique text,
  notes text
);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  workout_day_id uuid references workout_days(id),
  started_at timestamptz default now(),
  finished_at timestamptz,
  duration_seconds int,
  difficulty int,
  energy int,
  pain_level int,
  notes text,
  total_volume numeric default 0
);

create table exercise_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions(id) on delete cascade,
  exercise_id uuid references exercises(id),
  set_number int not null,
  weight numeric not null,
  reps int not null,
  rir int,
  rpe int,
  completed_at timestamptz default now(),
  is_warmup boolean default false,
  is_failure boolean default false
);

create table body_weight_logs (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, date timestamptz default now(), weight_kg numeric not null);
create table body_measurements (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, date timestamptz default now(), measurements jsonb not null);
create table pain_logs (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, date timestamptz default now(), region text, intensity int, pain_type text, movement text, notes text);
create table weekly_checkins (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, date timestamptz default now(), answers jsonb not null, recommendation text);
create table cardio_sessions (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, date timestamptz default now(), cardio_type text, duration_minutes int, distance numeric, intensity text, notes text);
create table achievements (id uuid primary key default gen_random_uuid(), title text not null, description text);
create table user_achievements (id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id) on delete cascade, achievement_id uuid references achievements(id), unlocked_at timestamptz default now());
create table mascot_messages (id uuid primary key default gen_random_uuid(), variant text, title text, message text, is_active boolean default true);

alter table profiles enable row level security;
alter table workout_plans enable row level security;
alter table workout_days enable row level security;
alter table workout_exercises enable row level security;
alter table workout_sessions enable row level security;
alter table exercise_sets enable row level security;
alter table body_weight_logs enable row level security;
alter table body_measurements enable row level security;
alter table pain_logs enable row level security;
alter table weekly_checkins enable row level security;
alter table cardio_sessions enable row level security;
alter table user_achievements enable row level security;
alter table exercises enable row level security;
alter table achievements enable row level security;
alter table mascot_messages enable row level security;

create policy "profiles own rows" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "public exercises read" on exercises for select using (is_active = true);
create policy "public achievements read" on achievements for select using (true);
create policy "public mascot messages read" on mascot_messages for select using (is_active = true);
create policy "plans own rows" on workout_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sessions own rows" on workout_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weight own rows" on body_weight_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "measurements own rows" on body_measurements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pain own rows" on pain_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "checkins own rows" on weekly_checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cardio own rows" on cardio_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user achievements own rows" on user_achievements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
