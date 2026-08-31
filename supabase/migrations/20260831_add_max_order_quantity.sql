-- Add per-product max_order_quantity column if missing
-- Run this in Supabase SQL Editor or use the supabase CLI to apply.

alter table products add column if not exists max_order_quantity integer;
