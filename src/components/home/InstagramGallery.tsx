import { motion } from 'framer-motion';
import { FiInstagram, FiPlay } from 'react-icons/fi';
import SectionHeading from '../common/SectionHeading';
import { useSocialPosts } from '../../hooks/useCatalog';

const INSTAGRAM_URL = 'https://www.instagram.com/drkaram.abdelrazek';

/**
 * "Follow the Ritual" gallery — fully admin-managed from /admin/social-posts.
 * Every tile's thumbnail is a real image the admin uploaded (a screenshot from
 * the actual video) — there's no auto-fetch/random fallback, since Instagram
 * and TikTok block automated thumbnail scraping and that only ever produced
 * unrelated placeholder photos. A post with no uploaded image simply isn't
 * shown on the storefront.
 */
export default function InstagramGallery() {
  const { data: posts = [], isLoading } = useSocialPosts();
  const active = posts.filter((p) => p.isEnabled && p.image);

  if (!isLoading && active.length === 0) return null;

  return (
    <section className="container-luxe py-16 md:py-20">
      <SectionHeading eyebrow="@drkaram.abdelrazek" title="Follow the Ritual" align="center" />

      <div className="mt-12 grid grid-cols-3 md:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)
          : active.map((post, i) => (
              <motion.a
                key={post.id}
                href={post.link || INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative aspect-square rounded-2xl overflow-hidden group"
              >
                <img
                  src={post.image}
                  alt="Social media content"
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {post.isVideo && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm z-10">
                    <FiPlay size={12} fill="white" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <FiInstagram className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                </div>
              </motion.a>
            ))}
      </div>
    </section>
  );
}
