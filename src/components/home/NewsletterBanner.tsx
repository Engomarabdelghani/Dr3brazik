import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';

export default function NewsletterBanner() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  return (
    <section className="container-luxe py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-[32px] px-8 py-14 md:py-20 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-ink), #2A1C1F)' }}
      >
        <span className="eyebrow">Join the Circle</span>
        <h2 className="section-title mt-3" style={{ color: '#fff' }}>Get 10% Off Your First Order</h2>
        <p className="mt-4 max-w-md mx-auto text-sm text-gray-400">
          Subscribe for early access to new arrivals, exclusive offers and beauty rituals.
        </p>
        {submitted ? (
          <p className="mt-8 font-semibold" style={{ color: 'var(--color-gold-light)' }}>You're on the list — welcome!</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 rounded-full px-5 py-3 text-sm outline-none"
            />
            <Button type="submit" variant="gold">Subscribe</Button>
          </form>
        )}
      </motion.div>
    </section>
  );
}
