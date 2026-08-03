import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBox, FiTag, FiPercent, FiImage, FiPlus, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import { fetchDashboardStats } from '../../lib/api/dashboard';
import { cld } from '../../utils/cloudinary';

const statCards = [
  { key: 'productCount' as const, label: 'Products', icon: FiBox, tone: 'ink' },
  { key: 'categoryCount' as const, label: 'Categories', icon: FiTag, tone: 'gold' },
  { key: 'activeOfferCount' as const, label: 'Active Offers', icon: FiPercent, tone: 'gold' },
  { key: 'totalImages' as const, label: 'Total Images', icon: FiImage, tone: 'ink' },
];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: fetchDashboardStats });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Welcome back — here's what's happening in your store.</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <FiPlus /> Add Product
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="card-luxe p-5"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: card.tone === 'gold' ? 'rgba(201,162,39,0.12)' : 'rgba(17,24,39,0.06)' }}
            >
              <card.icon size={18} style={{ color: card.tone === 'gold' ? 'var(--color-gold)' : 'var(--color-ink)' }} />
            </div>
            <p className="text-2xl font-extrabold">{isLoading ? '—' : data?.[card.key]?.toLocaleString()}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{card.label}</p>
          </motion.div>
        ))}
      </div>

      {!isLoading && data && data.outOfStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-8" style={{ backgroundColor: 'rgba(220,38,38,0.06)' }}>
          <FiAlertTriangle style={{ color: '#dc2626' }} />
          <p className="text-sm" style={{ color: 'var(--color-ink)' }}>
            <strong>{data.outOfStockCount}</strong> product{data.outOfStockCount > 1 ? 's are' : ' is'} out of stock.
          </p>
          <Link to="/admin/products?status=out-of-stock" className="text-sm font-semibold ml-auto flex items-center gap-1" style={{ color: '#dc2626' }}>
            Review <FiArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-luxe p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">Recent Products</h2>
            <Link to="/admin/products" className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading…</p>}
            {!isLoading && data?.recentProducts.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No products yet.</p>
            )}
            {data?.recentProducts.map((p) => (
              <Link
                key={p.id}
                to={`/admin/products/${p.id}/edit`}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-black/5 transition-colors"
              >
                <img
                  src={p.images[0] ? cld(p.images[0], 100) : 'https://picsum.photos/seed/placeholder/100/100'}
                  alt={p.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{p.brand}</p>
                </div>
                <p className="text-sm font-semibold shrink-0">{p.price.toLocaleString()} {p.currency}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-luxe p-6">
          <h2 className="font-bold mb-5">Quick Actions</h2>
          <div className="space-y-2">
            <Link to="/admin/products/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
              <FiBox size={16} style={{ color: 'var(--color-gold)' }} /> Add a Product
            </Link>
            <Link to="/admin/categories" className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
              <FiTag size={16} style={{ color: 'var(--color-gold)' }} /> Manage Categories
            </Link>
            <Link to="/admin/offers/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
              <FiPercent size={16} style={{ color: 'var(--color-gold)' }} /> Create an Offer
            </Link>
            <Link to="/admin/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
              <FiTag size={16} style={{ color: 'var(--color-gold)' }} /> Edit Site Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
