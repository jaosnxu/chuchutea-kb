create extension if not exists vector;

create table if not exists knowledge_entries (
  id text primary key,
  module text not null,
  title_zh text not null default '',
  title_ru text not null default '',
  content_zh text not null default '',
  content_ru text not null default '',
  image_url text not null default '',
  embedding vector(1536),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  created_by text default '',
  version int default 1,
  is_published bool default true
);

create index if not exists ix_knowledge_entries_module on knowledge_entries(module);

create table if not exists conversations (
  id text primary key,
  title text not null default '',
  lang text not null default 'zh',
  messages jsonb default '[]',
  pinned bool default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists users (
  id text primary key,
  username text unique not null,
  password_hash text not null,
  salt text not null,
  role text not null default 'viewer',
  allowed_modules jsonb default '[]',
  is_active bool default true,
  created_at timestamp default now()
);
