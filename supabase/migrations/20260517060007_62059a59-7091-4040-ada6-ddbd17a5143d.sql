
-- =========== PROFILES ===========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile + handle new user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========== PREFERENCES ===========
create table public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  location text,
  lifestyle text,
  style text,
  sleeveless_allowed boolean not null default true,
  short_outfits_allowed boolean not null default true,
  extra jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.preferences enable row level security;
create policy "prefs_all_own" on public.preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== WARDROBE ITEMS ===========
create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  name text,
  category text,                -- tops, jeans, trousers, skirts, dresses, ethnic, footwear, accessories, jackets, handbags
  subcategory text,
  colors text[] not null default '{}',
  primary_color text,
  pattern text,
  style text,                   -- casual, formal, sporty, ethnic, streetwear...
  aesthetic text,               -- minimal, romantic, edgy, classic...
  seasons text[] not null default '{}',
  occasions text[] not null default '{}',
  gender text,
  ai_description text,
  ai_analyzed boolean not null default false,
  worn_count int not null default 0,
  last_worn_at timestamptz,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);
create index wardrobe_user_idx on public.wardrobe_items(user_id);
alter table public.wardrobe_items enable row level security;
create policy "wardrobe_all_own" on public.wardrobe_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== OUTFITS ===========
create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  reasoning text,
  occasion text,
  mood text,
  weather jsonb,
  confidence numeric(3,2),
  color_harmony text,
  suggested_accessories text[] not null default '{}',
  item_ids uuid[] not null default '{}',
  collage_url text,
  saved boolean not null default false,
  worn boolean not null default false,
  worn_at timestamptz,
  created_at timestamptz not null default now()
);
create index outfits_user_idx on public.outfits(user_id, created_at desc);
alter table public.outfits enable row level security;
create policy "outfits_all_own" on public.outfits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== FEEDBACK ===========
create table public.outfit_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  outfit_id uuid not null references public.outfits(id) on delete cascade,
  liked boolean not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, outfit_id)
);
alter table public.outfit_feedback enable row level security;
create policy "feedback_all_own" on public.outfit_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========== STORAGE BUCKETS ===========
insert into storage.buckets (id, name, public) values ('wardrobe-images', 'wardrobe-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('collages', 'collages', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

-- Storage policies: public read, owner write under their uid folder
create policy "wardrobe_read_public" on storage.objects for select using (bucket_id = 'wardrobe-images');
create policy "wardrobe_write_own"   on storage.objects for insert with check (bucket_id = 'wardrobe-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "wardrobe_update_own"  on storage.objects for update using (bucket_id = 'wardrobe-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "wardrobe_delete_own"  on storage.objects for delete using (bucket_id = 'wardrobe-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "collages_read_public" on storage.objects for select using (bucket_id = 'collages');
create policy "collages_write_own"   on storage.objects for insert with check (bucket_id = 'collages' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "collages_delete_own"  on storage.objects for delete using (bucket_id = 'collages' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_read_public"  on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_write_own"    on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_update_own"   on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_delete_own"   on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
