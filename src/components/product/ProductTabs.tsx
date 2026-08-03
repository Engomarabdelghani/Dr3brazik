import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiCheck, FiStar, FiTrash2 } from 'react-icons/fi';
import type { Product, FAQ } from '../../types';
import { fetchReviews, createReview, deleteReview } from '../../lib/api/reviews';
import { useAdminAuth } from '../../context/AdminAuthContext';
import RatingStars from '../ui/RatingStars';
import { cld } from '../../utils/cloudinary';

const sampleFaqs: FAQ[] = [
  { question: 'How often should I use this product?', answer: 'For best results, use as directed in the description — typically once or twice daily as part of your skincare routine.' },
  { question: 'Is this suitable for sensitive skin?', answer: 'Our formulas are dermatologically tested, but we always recommend a patch test 24 hours before first use.' },
  { question: 'What is your return policy?', answer: 'Unopened products can be returned within 14 days of delivery. Contact us via WhatsApp to start a return.' },
];

const tabs = ['Description', 'Ingredients', 'Benefits', 'Reviews', 'FAQ'] as const;
type Tab = typeof tabs[number];

interface ProductTabsProps {
  product: Product;
  /** Full live product catalog — pass `products` from useProducts() in the parent page.
   *  Used to show real, different "You May Also Like" items per product. */
  allProducts?: Product[];
}

export default function ProductTabs({ product, allProducts = [] }: ProductTabsProps) {
  const [active, setActive] = useState<Tab>('Description');
  const queryClient = useQueryClient();
  const { isAdmin } = useAdminAuth(); // real Supabase admin session — same one used by /admin

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', product.id],
    queryFn: () => fetchReviews(product.id),
  });

  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) return;
    setSubmitting(true);
    try {
      await createReview({ productId: product.id, author: authorName, rating, comment });
      await queryClient.invalidateQueries({ queryKey: ['reviews', product.id] });
      setAuthorName('');
      setComment('');
      setRating(5);
    } catch {
      alert('Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    try {
      await deleteReview(id);
      await queryClient.invalidateQueries({ queryKey: ['reviews', product.id] });
    } catch {
      alert('Could not delete this review.');
    }
  };

  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    if (allProducts.length === 0) return;
    const sameCategory = allProducts.filter((p) => p.id !== product.id && p.category === product.category);
    const others = allProducts.filter((p) => p.id !== product.id && p.category !== product.category);
    setRelated([...sameCategory, ...others].slice(0, 4));
  }, [product.id, product.category, allProducts]);

  return (
    <div className="mt-20 relative">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide border-b" style={{ borderColor: 'var(--color-border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="px-5 py-3 text-sm font-semibold whitespace-nowrap relative"
            style={{ color: active === tab ? 'var(--color-ink)' : 'var(--color-muted)' }}
          >
            {tab}
            {tab === 'Reviews' && (
              <span className="ml-1.5 text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: 'var(--color-blush)' }}>
                {reviews.length}
              </span>
            )}
            {active === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--color-gold)' }} />
            )}
          </button>
        ))}
      </div>

      <div className="py-8 max-w-3xl">
        {active === 'Description' && (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{product.description}</p>
        )}

        {active === 'Ingredients' && (
          <ul className="grid grid-cols-2 gap-3">
            {product.ingredients?.map((ing) => (
              <li key={ing} className="flex items-center gap-2 text-sm">
                <FiCheck style={{ color: 'var(--color-gold)' }} /> {ing}
              </li>
            ))}
          </ul>
        )}

        {active === 'Benefits' && (
          <ul className="grid grid-cols-2 gap-3">
            {product.benefits?.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <FiCheck style={{ color: 'var(--color-gold)' }} /> {b}
              </li>
            ))}
          </ul>
        )}

        {active === 'Reviews' && (
          <div className="space-y-8">
            <form onSubmit={handleAddReview} className="p-5 rounded-2xl space-y-4" style={{ backgroundColor: 'var(--color-cream)' }}>
              <h4 className="font-semibold text-base">Write a Review</h4>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-muted)' }}>Your Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-lg focus:outline-none transition-colors"
                      style={{ color: star <= (hoverRating || rating) ? 'var(--color-gold)' : '#d1d5db' }}
                    >
                      <FiStar fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                required
                placeholder="Your Name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="input-luxe bg-white"
              />

              <textarea
                required
                rows={3}
                placeholder="Share your thoughts about this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input-luxe bg-white"
              />

              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>

            <div className="space-y-6">
              {reviewsLoading && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading reviews…</p>}
              {!reviewsLoading && reviews.length === 0 && (
                <p className="text-sm italic" style={{ color: 'var(--color-muted)' }}>No reviews yet. Be the first to leave one!</p>
              )}
              {reviews.map((r) => (
                <div key={r.id} className="pb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold text-sm">{r.author}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{r.date}</span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors"
                          style={{ color: '#dc2626', backgroundColor: 'rgba(220,38,38,0.08)' }}
                          title="Delete review (admin)"
                        >
                          <FiTrash2 size={13} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <RatingStars rating={r.rating} size={12} />
                  <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {active === 'FAQ' && (
          <div className="space-y-5">
            {sampleFaqs.map((f) => (
              <div key={f.question}>
                <p className="font-semibold text-sm mb-1.5">{f.question}</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{f.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-16 pt-10 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-xl font-bold mb-6">You May Also Like</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((item) => (
              <Link key={item.id} to={`/product/${item.slug}`} className="card-luxe p-3 block hover:-translate-y-1 transition-transform">
                <img
                  src={item.images[0] ? cld(item.images[0], 340) : 'https://picsum.photos/seed/placeholder/340/340'}
                  alt={item.name}
                  className="w-full aspect-square object-cover rounded-xl mb-3"
                />
                <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--color-gold)' }}>
                  {item.price.toLocaleString()} {item.currency}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}