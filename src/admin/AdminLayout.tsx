import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiBox, FiTag, FiPercent, FiImage, FiTruck, FiLogOut, FiMenu, FiX, FiExternalLink,
} from 'react-icons/fi';
import { useAdminAuth } from '../context/AdminAuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Products', icon: FiBox },
  { to: '/admin/categories', label: 'Categories', icon: FiTag },
  { to: '/admin/offers', label: 'Offers', icon: FiPercent },
  { to: '/admin/promo-banners', label: 'Promo Banners', icon: FiImage },
  { to: '/admin/shipping-zones', label: 'Shipping Zones', icon: FiTruck },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center px-6 py-8">
        <img src="/images/logo.png" alt="Dr. Karam AbdelRazek" className="h-10 w-auto object-contain" />
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
              backgroundColor: isActive ? 'var(--color-ink)' : 'transparent',
              color: isActive ? '#fff' : 'var(--color-ink)',
            })}
          >
            <item.icon size={17} />
            {item.label}
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
          <FiExternalLink size={17} /> View Site
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium hover:bg-red-50 transition-colors w-full"
          style={{ color: '#dc2626' }}
        >
          <FiLogOut size={17} /> Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--color-bg)' }}>
      <aside
        className="hidden lg:block w-64 shrink-0 border-r sticky top-0 h-screen"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <SidebarContent />
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-5 py-4 glass border-b" style={{ borderColor: 'var(--color-border)' }}>
        <img src="/images/logo.png" alt="Dr. Karam AbdelRazek" className="h-8 w-auto object-contain" />
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
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
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 bottom-0 w-72 z-50 shadow-2xl"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              <div className="flex justify-end px-4 pt-4">
                <button onClick={() => setMobileOpen(false)} aria-label="Close menu"><FiX size={22} /></button>
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
