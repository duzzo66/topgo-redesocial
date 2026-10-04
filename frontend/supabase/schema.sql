-- Execute este arquivo no SQL Editor do Supabase.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 16),
  display_name text not null default '',
  bio text not null default '',
  location text not null default '',
  avatar_url text,
  banner_url text,
  theme text not null default 'white' check (theme in ('white', 'dark')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'gif', 'video')),
  original_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 280),
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_reposts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.post_media enable row level security;
alter table public.comments enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_reposts enable row level security;
alter table public.post_bookmarks enable row level security;

create policy "profiles are visible to authenticated users" on public.profiles for select to authenticated using (true);
create policy "users manage their profile" on public.profiles for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "posts are visible to authenticated users" on public.posts for select to authenticated using (true);
create policy "follows are visible to authenticated users" on public.follows for select to authenticated using (true);
create policy "users can follow others" on public.follows for insert to authenticated with check (auth.uid() = follower_id and follower_id <> following_id);
create policy "users can unfollow" on public.follows for delete to authenticated using (auth.uid() = follower_id);
create policy "users create their posts" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "users delete their posts" on public.posts for delete to authenticated using (auth.uid() = author_id);
create policy "post media is visible to authenticated users" on public.post_media for select to authenticated using (true);
create policy "authors manage post media" on public.post_media for all to authenticated using (exists (select 1 from public.posts where posts.id = post_media.post_id and posts.author_id = auth.uid())) with check (exists (select 1 from public.posts where posts.id = post_media.post_id and posts.author_id = auth.uid()));
create policy "comments are visible to authenticated users" on public.comments for select to authenticated using (true);
create policy "users create comments" on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "users delete their comments" on public.comments for delete to authenticated using (auth.uid() = author_id);
create policy "likes are visible to authenticated users" on public.post_likes for select to authenticated using (true);
create policy "users manage their likes" on public.post_likes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reposts are visible to authenticated users" on public.post_reposts for select to authenticated using (true);
create policy "users manage their reposts" on public.post_reposts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bookmarks are visible to authenticated users" on public.post_bookmarks for select to authenticated using (true);
create policy "users manage their bookmarks" on public.post_bookmarks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
create policy "media is publicly readable" on storage.objects for select using (bucket_id = 'media');
create policy "authenticated users upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "users delete their media" on storage.objects for delete to authenticated using (bucket_id = 'media' and owner_id = auth.uid()::text);
