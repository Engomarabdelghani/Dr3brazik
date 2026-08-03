-- ============================================================================
-- Dr. Karam AbdelRazek — Supabase Schema
-- Run this ONCE in your Supabase project's SQL Editor (Database > SQL Editor).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS where relevant.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ADMINS  (who is allowed to use the dashboard)
-- ----------------------------------------------------------------------------
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ----------------------------------------------------------------------------
-- CATEGORIES
-- ----------------------------------------------------------------------------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ar text,
  image text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  slug text not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);

-- ----------------------------------------------------------------------------
-- PRODUCTS
-- ----------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ar text,
  brand text,
  category_id uuid references categories(id) on delete set null,
  subcategory_id uuid references subcategories(id) on delete set null,
  description text default '',
  short_description text default '',
  ingredients text[] not null default '{}',
  how_to_use text default '',
  warnings text default '',
  benefits text[] not null default '{}',
  tags text[] not null default '{}',
  attributes jsonb not null default '{}',
  price numeric(10,2) not null default 0,
  old_price numeric(10,2),
  currency text not null default 'EGP',
  discount_percent numeric(5,2),
  stock integer not null default 0,
  sku text,
  barcode text,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_new boolean not null default false,
  is_visible boolean not null default true,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  meta_title text,
  meta_description text,
  images jsonb not null default '[]', -- [{ "url": "...", "path": "...", "position": 0 }]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_subcategory on products(subcategory_id);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_visible on products(is_visible);
create index if not exists idx_products_featured on products(is_featured) where is_featured = true;
create index if not exists idx_products_name_search on products using gin (to_tsvector('simple', name || ' ' || coalesce(brand, '')));

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

create or replace function total_product_images()
returns bigint
language sql
stable
as $$
  select coalesce(sum(jsonb_array_length(images)), 0) from products;
$$;

-- ----------------------------------------------------------------------------
-- OFFERS
-- ----------------------------------------------------------------------------
create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null,
  target_type text not null check (target_type in ('products', 'category')),
  category_id uuid references categories(id) on delete cascade,
  banner_image text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

create table if not exists offer_products (
  offer_id uuid not null references offers(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  primary key (offer_id, product_id)
);

create index if not exists idx_offers_active on offers(is_enabled, start_date, end_date);

-- A product's live/effective price given any currently-active offer targeting it.
-- Using this view means offers automatically "expire" the moment end_date passes —
-- no cron job needed, because it's evaluated live on every query.
create or replace view products_with_effective_price as
select
  p.*,
  coalesce(
    (
      select case o.discount_type
        when 'percent' then round(p.price * (1 - o.discount_value / 100), 2)
        when 'fixed' then greatest(p.price - o.discount_value, 0)
      end
      from offers o
      left join offer_products op on op.offer_id = o.id
      where o.is_enabled
        and now() between o.start_date and o.end_date
        and (
          (o.target_type = 'products' and op.product_id = p.id)
          or (o.target_type = 'category' and o.category_id = p.category_id)
        )
      order by o.discount_value desc
      limit 1
    ),
    p.price
  ) as effective_price
from products p;

-- ----------------------------------------------------------------------------
-- SETTINGS  (single row)
-- ----------------------------------------------------------------------------
create table if not exists settings (
  id integer primary key default 1,
  site_name text not null default 'Dr. Karam AbdelRazek',
  logo_url text,
  favicon_url text,
  whatsapp text,
  facebook text,
  instagram text,
  tiktok text,
  email text,
  address text,
  hero_images jsonb not null default '[]',
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_settings_updated_at on settings;
create trigger trg_settings_updated_at before update on settings
  for each row execute function set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table products enable row level security;
alter table offers enable row level security;
alter table offer_products enable row level security;
alter table settings enable row level security;
alter table admins enable row level security;

drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);

drop policy if exists "public read subcategories" on subcategories;
create policy "public read subcategories" on subcategories for select using (true);

drop policy if exists "public read visible products" on products;
create policy "public read visible products" on products for select using (is_visible = true);

drop policy if exists "public read enabled offers" on offers;
create policy "public read enabled offers" on offers for select using (is_enabled = true);

drop policy if exists "public read offer_products" on offer_products;
create policy "public read offer_products" on offer_products for select using (true);

drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);

drop policy if exists "admin full access categories" on categories;
create policy "admin full access categories" on categories for all using (is_admin()) with check (is_admin());

drop policy if exists "admin full access subcategories" on subcategories;
create policy "admin full access subcategories" on subcategories for all using (is_admin()) with check (is_admin());

drop policy if exists "admin full access products" on products;
create policy "admin full access products" on products for all using (is_admin()) with check (is_admin());

drop policy if exists "admin full access offers" on offers;
create policy "admin full access offers" on offers for all using (is_admin()) with check (is_admin());

drop policy if exists "admin full access offer_products" on offer_products;
create policy "admin full access offer_products" on offer_products for all using (is_admin()) with check (is_admin());

drop policy if exists "admin full access settings" on settings;
create policy "admin full access settings" on settings for all using (is_admin()) with check (is_admin());

drop policy if exists "admin read admins" on admins;
create policy "admin read admins" on admins for select using (is_admin());

-- ============================================================================
-- STORAGE  (product images)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "admin upload product images" on storage.objects;
create policy "admin upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images" on storage.objects
  for update using (bucket_id = 'product-images' and is_admin());

drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and is_admin());

-- ============================================================================
-- AFTER RUNNING THIS FILE:
-- 1. Go to Authentication > Users in Supabase, create your admin user (email + password).
-- 2. Copy that user's UUID, then run:
--      insert into admins (user_id) values ('paste-uuid-here');
-- 3. Copy your Project URL + anon public key (Settings > API) into your .env file.
-- ============================================================================
