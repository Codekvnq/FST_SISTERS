-- FST Sisters - Supabase schema (Postgres)
-- Run this in the Supabase SQL Editor once, for YOUR project.
-- Tables mirror the SQLite local cache. Columns are jsonb so the
-- Mongo-style snapshot rows from the sync worker can be applied 1:1.

create table if not exists public.sisters (
  id text primary key,
  firstName text,
  lastName text,
  middleName text,
  dateOfBirth text,
  placeOfBirth text,
  dates jsonb,
  education jsonb,
  contact jsonb,
  status text,
  version integer default 1,
  avatarBlob text,
  avatarMime text,
  avatarUpdatedAt text,
  deletedAt text,
  deletedBy text,
  createdAt text,
  updatedAt text
);

create table if not exists public.documents (
  id text primary key,
  sisterId text,
  category text,
  subcategory text,
  fileName text,
  originalName text,
  fileSize integer,
  mimeType text,
  driveFileId text,
  webViewLink text,
  checksumSha256 text,
  uploadStatus text,
  thumbnailPath text,
  version integer default 1,
  deletedAt text,
  deletedBy text,
  createdAt text,
  updatedAt text
);

create table if not exists public.users (
  id text primary key,
  username text,
  email text,
  role text,
  sisterId text,
  version integer default 1,
  deletedAt text,
  deletedBy text,
  createdAt text,
  updatedAt text
);

-- Indexes for common lookups
create index if not exists idx_sisters_status on public.sisters(status);
create index if not exists idx_documents_sister on public.documents(sisterId);
create index if not exists idx_users_email on public.users(email);

-- Make all tables readable/'safe' by default (Row Level Security)
alter table public.sisters enable row level security;
alter table public.documents enable row level security;
alter table public.users enable row level security;

-- Access policy: allow the service role (server) full access.
-- The browser clients do NOT hold write keys; all writes go through the backend.
drop policy if exists "service_role_all_sisters" on public.sisters;
create policy "service_role_all_sisters" on public.sisters for all using (auth.role() = 'service_role');

drop policy if exists "service_role_all_documents" on public.documents;
create policy "service_role_all_documents" on public.documents for all using (auth.role() = 'service_role');

drop policy if exists "service_role_all_users" on public.users;
create policy "service_role_all_users" on public.users for all using (auth.role() = 'service_role');