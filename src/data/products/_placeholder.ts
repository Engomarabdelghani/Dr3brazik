/**
 * Temporary placeholder image generator (picsum.photos) used only until real
 * product photography is added. Once you're adding real products, just paste
 * your Cloudinary URLs directly into `images: [...]` instead of calling this.
 */
export const placeholderImg = (seed: string, w = 900, h = 1100) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
