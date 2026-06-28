-- ============================================================
-- 한국 조류 도감 — Supabase 스키마 + RLS
-- ============================================================

-- 확장
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUM 타입
-- ============================================================
create type bird_type as enum ('resident', 'migratory');
create type bird_rarity as enum ('common', 'endangered_2', 'endangered_1');
create type upload_status as enum ('pending', 'success', 'failed');

-- ============================================================
-- 테이블
-- ============================================================

-- users
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  kakao_id text unique not null,
  nickname text not null,
  region text,
  created_at timestamptz default now()
);

-- birds (시드 데이터로 채움)
create table birds (
  id uuid primary key default uuid_generate_v4(),
  name_ko text not null,
  name_sci text not null,
  type bird_type not null,
  regions text[] not null default '{}',
  season_start int,
  season_end int,
  rarity bird_rarity not null default 'common',
  description text,
  image_url text,
  silhouette_url text default '/silhouette.svg',
  created_at timestamptz default now()
);

-- uploads
create table uploads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  storage_url text not null,
  image_hash text unique not null,
  exif_taken_at timestamptz,
  ai_result text,
  ai_confidence float,
  status upload_status not null default 'pending',
  created_at timestamptz default now()
);

-- user_birds (해금 기록)
create table user_birds (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  bird_id uuid not null references birds(id) on delete cascade,
  upload_id uuid references uploads(id) on delete set null,
  unlocked_at timestamptz default now(),
  unique (user_id, bird_id)
);

-- ============================================================
-- 인덱스
-- ============================================================
create index idx_user_birds_user_id on user_birds(user_id);
create index idx_user_birds_bird_id on user_birds(bird_id);
create index idx_uploads_user_id on uploads(user_id);
create index idx_uploads_image_hash on uploads(image_hash);
create index idx_birds_type on birds(type);
create index idx_birds_rarity on birds(rarity);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table users enable row level security;
alter table birds enable row level security;
alter table uploads enable row level security;
alter table user_birds enable row level security;

-- users: 본인 행만 읽기/수정
create policy "users_select_own" on users for select using (auth.uid() = id);
create policy "users_insert_own" on users for insert with check (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);

-- birds: 전체 공개 읽기
create policy "birds_select_all" on birds for select using (true);

-- uploads: 본인 것만
create policy "uploads_select_own" on uploads for select using (auth.uid() = user_id);
create policy "uploads_insert_own" on uploads for insert with check (auth.uid() = user_id);
create policy "uploads_update_own" on uploads for update using (auth.uid() = user_id);

-- user_birds: 읽기는 전체 공개 (랭킹 집계), 쓰기는 본인만
create policy "user_birds_select_all" on user_birds for select using (true);
create policy "user_birds_insert_own" on user_birds for insert with check (auth.uid() = user_id);

-- ============================================================
-- Storage 버킷 (Supabase 대시보드 또는 아래 SQL로 생성)
-- ============================================================
insert into storage.buckets (id, name, public) values ('bird-uploads', 'bird-uploads', false);

create policy "upload_insert_auth" on storage.objects
  for insert with check (
    bucket_id = 'bird-uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "upload_select_own" on storage.objects
  for select using (bucket_id = 'bird-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
