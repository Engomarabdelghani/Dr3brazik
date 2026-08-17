import { supabase } from '../supabase';
import type { SocialPost } from '../../types';

interface SocialPostRow {
  id: string;
  link: string;
  image: string | null;
  is_video: boolean;
  sort_order: number;
  is_enabled: boolean;
}

function mapPost(row: SocialPostRow): SocialPost {
  return {
    id: row.id,
    link: row.link,
    image: row.image ?? undefined,
    isVideo: row.is_video,
    sortOrder: row.sort_order,
    isEnabled: row.is_enabled,
  };
}

export async function fetchSocialPosts(): Promise<SocialPost[]> {
  const { data, error } = await supabase.from('social_posts').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export interface SocialPostInput {
  link: string;
  image?: string;
  isVideo: boolean;
  sortOrder: number;
  isEnabled: boolean;
}

export async function createSocialPost(input: SocialPostInput): Promise<void> {
  const { error } = await supabase.from('social_posts').insert({
    link: input.link, image: input.image || null, is_video: input.isVideo,
    sort_order: input.sortOrder, is_enabled: input.isEnabled,
  });
  if (error) throw error;
}

export async function updateSocialPost(id: string, input: SocialPostInput): Promise<void> {
  const { error } = await supabase.from('social_posts').update({
    link: input.link, image: input.image || null, is_video: input.isVideo,
    sort_order: input.sortOrder, is_enabled: input.isEnabled,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteSocialPost(id: string): Promise<void> {
  const { error } = await supabase.from('social_posts').delete().eq('id', id);
  if (error) throw error;
}

/** Best-effort thumbnail when the admin didn't upload a custom image — mirrors the old hardcoded behavior. */
export function deriveThumbnail(post: SocialPost, fallbackSeed: string): string {
  if (post.image) return post.image;
  const match = post.link.match(/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if (match?.[1]) return `https://www.instagram.com/p/${match[1]}/media/?size=l`;
  return `https://picsum.photos/seed/${fallbackSeed}/400/400`;
}
