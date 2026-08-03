/**
 * Wraps a Cloudinary delivery URL with automatic format/quality and an optional
 * width transformation, so every image is served optimized (WebP/AVIF where
 * supported, compressed) without touching the original upload.
 *
 * Paste your Cloudinary image URLs as-is into `images: [...]` in the product
 * data files — this function does the rest. Non-Cloudinary URLs (e.g. the
 * placeholder picsum.photos images) are returned unchanged, so nothing breaks
 * while you're still filling in real product photos.
 *
 * Example:
 *   cld('https://res.cloudinary.com/demo/image/upload/v1234/serum.jpg', 600)
 *   -> https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_600/v1234/serum.jpg
 */
export function cld(url: string, width?: number): string {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

  const transform = width ? `f_auto,q_auto,w_${width}` : 'f_auto,q_auto';
  // Avoid double-applying if a transform was already baked into the pasted URL.
  if (/\/upload\/[^/]*f_auto/.test(url)) return url;

  return url.replace('/upload/', `/upload/${transform}/`);
}
