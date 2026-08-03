import { motion } from 'framer-motion';
import { FiInstagram, FiPlay } from 'react-icons/fi';
import SectionHeading from '../common/SectionHeading';

// رابط صفحة الإنستجرام الأساسية
const INSTAGRAM_URL = 'https://www.instagram.com/drkaram.abdelrazek';

interface InstagramPost {
  image?: string; // صورة اختيارية (لو عايز تحط صورة من عندك)
  link: string;   // رابط فيديو الريلز أو البوست الحقيقي من إنستجرام
  isVideo?: boolean; // هل العنصر ده فيديو؟
}

// 📌 حط هنا لينكات الفيديوهات أو البوستات الحقيقية
const posts: InstagramPost[] = [
  {
    link: 'https://www.instagram.com/dr_3brazik/reel/DZ-FvVQNpoO/', 
    image: 'https://res.cloudinary.com/djxxsn3dh/image/upload/v1785753855/1_nvfycx.jpg ', 
    isVideo: true,
  },
  {
    link: 'https://www.instagram.com/dr_3brazik/reel/DbgWTRfl50R/',
    image: 'https://res.cloudinary.com/djxxsn3dh/image/upload/v1785753855/2_jcnpvy.jpg',
  },
  {
    link: 'https://www.instagram.com/dr_3brazik/reel/DbYeq2PDeGF/',
    image: 'https://res.cloudinary.com/djxxsn3dh/image/upload/v1785753855/3_cvuywy.jpg',
    isVideo: true,
  },
  {
    link: 'https://www.tiktok.com/@dr_3brazik/video/7667232914110680328?is_from_webapp=1&sender_device=pc&web_id=7621531848258864648',
    image: 'https://res.cloudinary.com/djxxsn3dh/image/upload/v1785753855/4_ychxmd.jpg',
  },
  {
    link: 'https://www.tiktok.com/@dr_3brazik/video/7665315655851232530?is_from_webapp=1&sender_device=pc&web_id=7621531848258864648',
    image: 'https://res.cloudinary.com/djxxsn3dh/image/upload/v1785753855/5_jpcss3.jpg',
    isVideo: true,
  },
  {
    link: 'https://www.tiktok.com/@dr_3brazik/video/7664636834588183815?is_from_webapp=1&sender_device=pc&web_id=7621531848258864648',
    image: 'https://res.cloudinary.com/djxxsn3dh/image/upload/v1785753857/6_dxw53s.jpg',
  },
];

// 💡 دالة للحصول على غلاف الفيديو تلقائياً برابط الـ Shortcode من انستجرام
const getInstagramThumbnail = (post: InstagramPost) => {
  if (post.image) return post.image;

  // استخراج الكود الخاص بالبوست أو الريلز من اللينك
  const match = post.link.match(/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if (match && match[1]) {
    const shortcode = match[1];
    // خدمة مجانية للـ Thumbnails الخفيفة الخاصة بإنستجرام
    return `https://www.instagram.com/p/${shortcode}/media/?size=l`;
  }

  // صورة بديلة في حالة عدم توفر اللينك بشكل صحيح
  return 'https://picsum.photos/seed/beauty/400/400';
};

export default function InstagramGallery() {
  return (
    <section className="container-luxe py-16 md:py-20">
      <SectionHeading eyebrow="@drkaram.abdelrazek" title="Follow the Ritual" align="center" />
      
      <div className="mt-12 grid grid-cols-3 md:grid-cols-6 gap-3">
        {posts.map((post, i) => {
          const thumbnailUrl = getInstagramThumbnail(post);

          return (
            <motion.a
              key={i}
              href={post.link || INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="relative aspect-square rounded-2xl overflow-hidden group"
            >
              {/* صورة الغلاف */}
              <img
                src={thumbnailUrl}
                alt="Instagram content"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  // Fallback عند حدوث مشكلة في تحميل غلاف إنستجرام المباشر
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/beauty-${i}/400/400`;
                }}
              />

              {/* أيكون تشغيل الفيديو إذا كان المنشور عبارة عن Reel/Video */}
              {post.isVideo && (
                <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full backdrop-blur-sm z-10">
                  <FiPlay size={12} fill="white" />
                </div>
              )}

              {/* الهوفر مع أيقونة انستجرام */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <FiInstagram className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}