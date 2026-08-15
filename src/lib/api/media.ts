import { supabase, SITE_IMAGES_BUCKET } from '../supabase';

/** Uploads a single image to the shared site-images bucket under `folder/`, returns its public URL + storage path. */
export async function uploadSiteImage(file: File, folder: string): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(SITE_IMAGES_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteSiteImage(path: string | null | undefined): Promise<void> {
  if (!path) return;
  await supabase.storage.from(SITE_IMAGES_BUCKET).remove([path]);
}

/** Extracts the storage path from a public site-images URL, so we can delete old images by URL alone. */
export function sitePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${SITE_IMAGES_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}
