import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiHeart, FiShoppingBag, FiMenu, FiX } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { NAV_LINKS, SITE_NAME } from '../../data/constants';
import { useProducts } from '../../hooks/useCatalog';
import { cld } from '../../utils/cloudinary';

export default function Navbar({ topOffset = 0 }: { topOffset?: number }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { itemCount, openCart } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { data: products = [] } = useProducts();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const results = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      }).slice(0, 6)
    : [];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 z-40 transition-all duration-500 ${scrolled ? 'shadow-sm py-3' : 'py-5'}`}
        style={{
          top: topOffset,
          background: scrolled ? 'rgba(247, 239, 232, 0.88)' : 'rgba(247, 239, 232, 0.74)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: scrolled ? '1px solid rgba(120, 90, 74, 0.12)' : '1px solid transparent',
        }}
      >
        <div className="container-luxe flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/images/logo.png" alt={SITE_NAME} className="h-10 md:h-12 w-auto object-contain" />
          </Link>

          <nav className="hidden lg:flex items-center gap-9">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wide transition-colors relative pb-1 ${isActive ? '' : 'hover:text-[var(--color-gold)]'}`
                }
                style={({ isActive }) => ({ color: isActive ? 'var(--color-gold)' : 'var(--color-coffee)' })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 md:gap-3">
            <button aria-label="Search" onClick={() => setSearchOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
              <FiSearch size={18} />
            </button>
            <Link to="/wishlist" className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
              <FiHeart size={18} />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: 'var(--color-gold)' }}>
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <button aria-label="Open cart" onClick={openCart} className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
              <FiShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: 'var(--color-coffee)' }}>
                  {itemCount}
                </span>
              )}
            </button>
            <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
              <FiMenu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 w-[82%] max-w-sm bg-white z-50 p-6 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <img src="/images/logo.png" alt={SITE_NAME} className="h-9 w-auto object-contain" />
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                  <FiX size={22} />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className="py-3 text-base font-medium border-b"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 glass flex flex-col items-center pt-28 px-6"
          >
            <button aria-label="Close search" onClick={() => setSearchOpen(false)} className="absolute top-6 right-6">
              <FiX size={26} />
            </button>
            <form onSubmit={submitSearch} className="w-full max-w-xl">
              <div className="flex items-center gap-3 border-b-2 pb-3" style={{ borderColor: 'var(--color-coffee)' }}>
                <FiSearch size={22} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full bg-transparent outline-none text-xl"
                />
              </div>
            </form>
            {results.length > 0 && (
              <div className="w-full max-w-xl mt-6 space-y-3">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-4 p-2 rounded-xl hover:bg-black/5 transition-colors"
                  >
                    <img src={cld(p.images[0], 100)} alt={p.name} loading="lazy" decoding="async" className="w-14 h-14 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{p.price} {p.currency}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
