import { api } from '../../api/client';
import type { SocialPost } from '../../types';

/** Storefront: enabled posts. */
export async function fetchSocialPosts(): Promise<SocialPost[]> {
  return api.get<SocialPost[]>('/social-posts');
}

export async function fetchAdminSocialPosts(): Promise<SocialPost[]> {
  return api.get<SocialPost[]>('/admin/social-posts');
}

export interface SocialPostInput {
  link: string;
  image: string; // required — a real screenshot/thumbnail from the video, not auto-fetched
  isVideo: boolean;
  sortOrder: number;
  isEnabled: boolean;
}

export async function createSocialPost(input: SocialPostInput): Promise<void> {
  await api.post('/admin/social-posts', input);
}

export async function updateSocialPost(id: string, input: SocialPostInput): Promise<void> {
  await api.put(`/admin/social-posts/${id}`, input);
}

export async function deleteSocialPost(id: string): Promise<void> {
  await api.delete(`/admin/social-posts/${id}`);
}
