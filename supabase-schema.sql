-- ========================================
-- WasteWise Marketplace Schema
-- Run this in Supabase SQL Editor
-- ========================================

create extension if not exists "pgcrypto";

create table if not exists listings (
    id uuid primary key default gen_random_uuid(),
    type text not null check (type in ('sell', 'free')),
    category text not null,
    title text not null,
    quantity_kg numeric,          -- used by 'sell' listings only
    price_per_kg numeric,         -- used by 'sell' listings only, nullable
    area_text text,               -- used by 'free' listings only
    image_url text,
    latitude double precision,    -- used by 'sell' listings only
    longitude double precision,   -- used by 'sell' listings only
    contact_phone text not null,
    status text not null default 'available' check (status in ('available', 'claimed')),
    created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table listings enable row level security;

-- Anyone can read listings (public marketplace board)
create policy "Public can view listings"
    on listings for select
    using (true);

-- Anyone can create a listing (no login required for this MVP)
create policy "Public can insert listings"
    on listings for insert
    with check (true);

-- Anyone can mark a listing as claimed
-- (Tighten this later once you add real accounts —
--  for now it lets a finder mark a free item as taken)
create policy "Public can update listing status"
    on listings for update
    using (true)
    with check (true);

-- ========================================
-- Storage bucket setup (run these AFTER creating
-- a bucket named "listings" via the Storage tab, set to Public)
-- ========================================

create policy "Public can upload listing images"
    on storage.objects for insert
    with check (bucket_id = 'listings');

create policy "Public can view listing images"
    on storage.objects for select
    using (bucket_id = 'listings');
