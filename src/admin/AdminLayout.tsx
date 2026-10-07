import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiShoppingBag, FiBox, FiTag, FiPercent, FiImage, FiTruck, FiInstagram, FiMessageSquare, FiGift, FiUsers, FiLogOut, FiMenu, FiX, FiExternalLink,
} from 'react-icons/fi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const NAV_ITEMS = [
  { to: '/admin', key: 'dashboard', icon: FiGrid, end: true },
  { to: '/admin/orders', key: 'orders', icon: FiShoppingBag },
  { to: '/admin/products', key: 'products', icon: FiBox },
  { to: '/admin/categories', key: 'categories', icon: FiTag },
  { to: '/admin/offers', key: 'offers', icon: FiPercent },
  { to: '/admin/promo-banners', key: 'promoBanners', icon: FiImage },
  { to: '/admin/shipping-zones', key: 'shippingZones', icon: FiTruck },
  { to: '/admin/social-posts', key: 'socialPosts', icon: FiInstagram },
  { to: '/admin/testimonials', key: 'testimonials', icon: FiMessageSquare },
  { to: '/admin/coupons', key: 'coupons', icon: FiGift },
  { to: '/admin/team', key: 'team', icon: FiUsers },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-8">
        <img src="/images/logo.png" alt="Dr. Karam AbdelRazek" className="h-10 w-auto object-contain" />
        <LanguageSwitcher />
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive ? 'shadow-sm' : 'hover:bg-black/5'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--color-coffee)' : 'transparent',
              color: isActive ? '#fff' : 'var(--color-coffee)',
            })}
          >
            <item.icon size={17} />
            {t(`admin.nav.${item.key}`)}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium hover:bg-black/5 transition-colors mb-1"
          style={{ color: 'var(--color-muted)' }}
        >
          <FiExternalLink size={17} /> {t('admin.viewSite')}
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium hover:bg-red-50 transition-colors w-full"
          style={{ color: '#dc2626' }}
        >
          <FiLogOut size={17} /> {t('admin.logout')}
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith('ar');

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
      <aside
        className="hidden lg:block w-64 shrink-0 border-e sticky top-0 h-screen"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-5 py-4 glass border-b" style={{ borderColor: 'var(--color-border)' }}>
        <img src="/images/logo.png" alt="Dr. Karam AbdelRazek" className="h-8 w-auto object-contain" />
        <LanguageSwitcher />
        <button onClick={() => setMobileOpen(true)} aria-label={t('navbar.openMenu')}>
          <FiMenu size={22} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50" onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: isArabic ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isArabic ? '100%' : '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 bottom-0 w-72 z-50 shadow-2xl"
              style={{ backgroundColor: 'var(--color-surface)', insetInlineStart: 0 }}
            >
              <div className="flex justify-end px-4 pt-4">
                <button onClick={() => setMobileOpen(false)} aria-label={t('navbar.closeMenu')}><FiX size={22} /></button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0 pt-20 lg:pt-0">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
