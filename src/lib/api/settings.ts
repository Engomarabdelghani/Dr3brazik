import { supabase } from '../supabase';
import type { SiteSettings } from '../../types';

interface SettingsRow {
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  email: string | null;
  address: string | null;
  hero_images: string[];
  seo_title: string | null;
  seo_description: string | null;
}

function mapSettings(row: SettingsRow): SiteSettings {
  return {
    siteName: row.site_name,
    logoUrl: row.logo_url ?? undefined,
    faviconUrl: row.favicon_url ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    facebook: row.facebook ?? undefined,
    instagram: row.instagram ?? undefined,
    tiktok: row.tiktok ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    heroImages: row.hero_images ?? [],
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
  };
}

export async function fetchSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return mapSettings(data);
}

export async function updateSettings(input: SiteSettings): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({
      site_name: input.siteName,
      logo_url: input.logoUrl || null,
      favicon_url: input.faviconUrl || null,
      whatsapp: input.whatsapp || null,
      facebook: input.facebook || null,
      instagram: input.instagram || null,
      tiktok: input.tiktok || null,
      email: input.email || null,
      address: input.address || null,
      hero_images: input.heroImages,
      seo_title: input.seoTitle || null,
      seo_description: input.seoDescription || null,
    })
    .eq('id', 1);
  if (error) throw error;
}
