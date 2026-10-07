#!/usr/bin/env node
/**
 * Generates public/sitemap.xml from the live catalog before every build
 * (wired as `prebuild` in package.json). Safe to run anytime: it only reads
 * from the API and overwrites public/sitemap.xml.
 *
 * Needs an absolute VITE_API_BASE_URL (e.g. https://api.dr3brazik.com/api), from
 * the environment (Vercel/CI) or the .env file Vite uses. If the API can't be
 * reached, the sitemap still gets the static pages and the build continues.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const SITE_URL = 'https://dr3brazik.com';

function readApiBaseUrl() {
  // On Vercel (and most CI), env vars are injected straight into process.env;
  // there's no physical .env file there. Locally, fall back to reading .env.
  if (process.env.VITE_API_BASE_URL) return process.env.VITE_API_BASE_URL;
  const envPath = path.join(ROOT, '.env');
  if (!existsSync(envPath)) return undefined;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*VITE_API_BASE_URL\s*=\s*(.*)?\s*$/);
    if (match) return (match[1] ?? '').trim();
  }
  return undefined;
}

async function main() {
  const apiBase = readApiBaseUrl()?.replace(/\/+$/, '');

  const staticUrls = ['/', '/shop', '/offers', '/about', '/contact'];
  let productUrls = [];
  let categoryUrls = [];

  if (apiBase && /^https?:\/\//.test(apiBase)) {
    try {
      const res = await fetch(`${apiBase}/sitemap-data`, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      productUrls = data.products.map((p) => ({ loc: `/product/${p.slug}`, lastmod: p.updatedAt }));
      // The Shop's category filter uses slugs (the old sitemap linked the category UUID).
      categoryUrls = data.categories.map((c) => ({ loc: `/shop?category=${encodeURIComponent(c.slug)}` }));
    } catch (err) {
      console.warn('[sitemap] Could not fetch from the API, falling back to static pages only:', err.message);
    }
  } else {
    console.warn('[sitemap] VITE_API_BASE_URL is missing or not an absolute URL; generating static pages only.');
  }

  const allUrls = [...staticUrls.map((loc) => ({ loc })), ...categoryUrls, ...productUrls];

  const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escape(`${SITE_URL}${u.loc}`)}</loc>${u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>
`;

  writeFileSync(path.join(ROOT, 'public', 'sitemap.xml'), xml);
  console.log(`[sitemap] Wrote ${allUrls.length} URLs to public/sitemap.xml`);
}

main();
