import { api } from '../../api/client';

/** Uploads one image to Cloudinary through the API. `folder`: categories, offers, promo-banners, social-posts, testimonials or products/<slug>. */
export async function uploadImage(file: File, folder: string): Promise<{ url: string; key: string }> {
  const form = new FormData();
  form.append('folder', folder);
  form.append('file', file);
  return api.post<{ url: string; key: string }>('/admin/uploads', form);
}

/** Deletes an uploaded image. The server ignores anything outside its own folder (seed or external images). */
export async function deleteUploadedImage(target: { key: string } | { url: string }): Promise<void> {
  await api.delete('/admin/uploads', target);
}

/** Single-image uploads (category images, offer and promo banners, social posts, testimonials). */
export async function uploadSiteImage(file: File, folder: string): Promise<{ url: string; path: string }> {
  const { url, key } = await uploadImage(file, folder);
  return { url, path: key };
}

export async function deleteSiteImage(url: string | null | undefined): Promise<void> {
  if (url) await deleteUploadedImage({ url });
}
