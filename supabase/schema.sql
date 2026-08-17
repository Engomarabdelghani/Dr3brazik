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

-- ============================================================================
-- BLOCK: BOGO offers + Promo Banners + Shipping Zones + shared site-images bucket
-- Adds:
--   1. BOGO ("buy X get Y at Z% off") support on the existing `offers` table
--   2. `promo_banners` table — circular/arch banners shown on the Home page
--   3. `shipping_zones` table — governorate list + delivery price for Checkout
--   4. A shared public `site-images` storage bucket (category images, offer
--      banners, promo banners) with the same public-read / admin-write policy
--      shape already used for `product-images`.
-- Safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- OFFERS: BOGO support
-- ----------------------------------------------------------------------------
alter table offers drop constraint if exists offers_discount_type_check;
alter table offers add constraint offers_discount_type_check
  check (discount_type in ('percent', 'fixed', 'bogo'));

alter table offers alter column discount_value drop not null;
alter table offers add column if not exists bogo_buy_qty integer not null default 1;
alter table offers add column if not exists bogo_get_qty integer not null default 1;
alter table offers add column if not exists bogo_get_discount_percent numeric(5,2) not null default 100;

-- BOGO offers are quantity-dependent (cart-level), not a flat per-unit price,
-- so they must never affect the live effective_price view — only percent/fixed do.
drop view if exists products_with_effective_price cascade;
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
        and o.discount_type in ('percent', 'fixed')
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
-- PROMO BANNERS  (circular/arch banners on the Home page)
-- ----------------------------------------------------------------------------
create table if not exists promo_banners (
  id uuid primary key default gen_random_uuid()
);
-- Add each column individually (if not exists) so this heals a table that may
-- already exist from a partial/earlier run, instead of only working on a
-- brand-new table.
alter table promo_banners add column if not exists title text not null default '';
alter table promo_banners add column if not exists image text not null default '';
alter table promo_banners add column if not exists link text;
alter table promo_banners add column if not exists sort_order integer not null default 0;
alter table promo_banners add column if not exists is_enabled boolean not null default true;
alter table promo_banners add column if not exists created_at timestamptz not null default now();

create index if not exists idx_promo_banners_sort on promo_banners(sort_order);

alter table promo_banners enable row level security;

drop policy if exists "public read enabled promo banners" on promo_banners;
create policy "public read enabled promo banners" on promo_banners
  for select using (is_enabled = true);

drop policy if exists "admin full access promo banners" on promo_banners;
create policy "admin full access promo banners" on promo_banners
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- SHIPPING ZONES  (governorate -> delivery price, used at Checkout)
-- ----------------------------------------------------------------------------
create table if not exists shipping_zones (
  id uuid primary key default gen_random_uuid()
);
alter table shipping_zones add column if not exists name text not null default '';
alter table shipping_zones add column if not exists price numeric(10,2) not null default 0;
alter table shipping_zones add column if not exists sort_order integer not null default 0;
alter table shipping_zones add column if not exists is_enabled boolean not null default true;
alter table shipping_zones add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'shipping_zones_name_key'
  ) then
    alter table shipping_zones add constraint shipping_zones_name_key unique (name);
  end if;
end $$;

create index if not exists idx_shipping_zones_sort on shipping_zones(sort_order);

alter table shipping_zones enable row level security;

drop policy if exists "public read enabled shipping zones" on shipping_zones;
create policy "public read enabled shipping zones" on shipping_zones
  for select using (is_enabled = true);

drop policy if exists "admin full access shipping zones" on shipping_zones;
create policy "admin full access shipping zones" on shipping_zones
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- STORAGE  (shared bucket for category images, offer banners, promo banners)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

drop policy if exists "public read site images" on storage.objects;
create policy "public read site images" on storage.objects
  for select using (bucket_id = 'site-images');

drop policy if exists "admin upload site images" on storage.objects;
create policy "admin upload site images" on storage.objects
  for insert with check (bucket_id = 'site-images' and is_admin());

drop policy if exists "admin update site images" on storage.objects;
create policy "admin update site images" on storage.objects
  for update using (bucket_id = 'site-images' and is_admin());

drop policy if exists "admin delete site images" on storage.objects;
create policy "admin delete site images" on storage.objects
  for delete using (bucket_id = 'site-images' and is_admin());

-- ============================================================================
-- AFTER RUNNING THIS BLOCK:
-- Seed shipping zones for Egypt's governorates from the dashboard
-- (Admin > Shipping Zones), or bulk-insert your own list, e.g.:
--   insert into shipping_zones (name, price, sort_order) values
--     ('القاهرة', 60, 1), ('الجيزة', 60, 2), ('الإسكندرية', 70, 3);
-- ============================================================================

-- ============================================================================
-- BLOCK: Shoppable promo banners (optional price -> tap-to-cart)
-- Lets the admin give a promo banner a price. When a banner has a price, tapping
-- it on the storefront adds it straight to the cart as a quick-buy deal instead
-- of just navigating to `link`. Banners without a price keep working exactly as
-- before (plain marketing link).
-- Safe to re-run.
-- ============================================================================
alter table promo_banners add column if not exists price numeric(10,2);

-- ============================================================================
-- BLOCK: Social posts ("Follow the Ritual" Instagram/TikTok gallery on Home)
-- Lets the admin manage the Home page's video/reel gallery instead of it being
-- hardcoded in the frontend. Each post is just a link (Instagram/TikTok reel
-- or post) plus an optional custom thumbnail image — if no image is uploaded,
-- the storefront tries to auto-derive a thumbnail from the link itself, same
-- as the previous hardcoded behavior.
-- Self-healing: builds column-by-column so this works even if a table with
-- this name already exists in a different shape from an earlier attempt.
-- Safe to re-run.
-- ============================================================================
create table if not exists social_posts (
  id uuid primary key default gen_random_uuid()
);
alter table social_posts add column if not exists link text not null default '';
alter table social_posts add column if not exists image text;
alter table social_posts add column if not exists is_video boolean not null default false;
alter table social_posts add column if not exists sort_order integer not null default 0;
alter table social_posts add column if not exists is_enabled boolean not null default true;
alter table social_posts add column if not exists created_at timestamptz not null default now();

create index if not exists idx_social_posts_sort on social_posts(sort_order);

alter table social_posts enable row level security;

drop policy if exists "public read enabled social posts" on social_posts;
create policy "public read enabled social posts" on social_posts
  for select using (is_enabled = true);

drop policy if exists "admin full access social posts" on social_posts;
create policy "admin full access social posts" on social_posts
  for all using (is_admin()) with check (is_admin());
