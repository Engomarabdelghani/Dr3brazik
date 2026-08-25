#!/usr/bin/env node
/**
 * Generates public/sitemap.xml from the live Supabase catalog before every build.
 * Runs automatically via `npm run build` (see package.json). Safe to run anytime —
 * it only reads from Supabase and overwrites public/sitemap.xml.
 *
 * Needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY — reads them straight out of
 * your .env file (same one Vite uses), no separate setup needed.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const SITE_URL = 'https://dr3brazik.com';

function loadEnv() {
  // On Vercel (and most CI), env vars are injected straight into process.env —
  // there's no physical .env file there. Locally, fall back to reading .env directly.
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    return { VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY };
  }
  const envPath = path.join(ROOT, '.env');
  if (!existsSync(envPath)) {
    console.warn('[sitemap] No .env file and no env vars found — skipping product/category URLs.');
    return {};
  }
  const text = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = (match[2] ?? '').trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;

  const staticUrls = ['/', '/shop', '/offers', '/about', '/contact'];
  let productUrls = [];
  let categoryUrls = [];

  if (url && key) {
    try {
      const supabase = createClient(url, key);
      const [{ data: products }, { data: categories }] = await Promise.all([
        supabase.from('products').select('slug, updated_at').eq('is_visible', true),
        supabase.from('categories').select('id, slug'),
      ]);
      productUrls = (products ?? []).map((p) => ({ loc: `/product/${p.slug}`, lastmod: p.updated_at }));
      categoryUrls = (categories ?? []).map((c) => ({ loc: `/shop?category=${c.id}` }));
    } catch (err) {
      console.warn('[sitemap] Could not fetch from Supabase, falling back to static pages only:', err.message);
    }
  } else {
    console.warn('[sitemap] Missing Supabase env vars — generating static pages only.');
  }

  const allUrls = [
    ...staticUrls.map((loc) => ({ loc })),
    ...categoryUrls,
    ...productUrls,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>
`;

  writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml);
  console.log(`[sitemap] Wrote ${allUrls.length} URLs to public/sitemap.xml`);
}

main();
