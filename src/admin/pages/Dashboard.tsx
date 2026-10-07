import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBox, FiTag, FiPercent, FiImage, FiPlus, FiAlertTriangle, FiArrowRight, FiShoppingBag } from 'react-icons/fi';
import { fetchDashboardStats } from '../../lib/api/dashboard';
import { cld } from '../../utils/cloudinary';
import { useTranslation } from 'react-i18next';

const statCards = [
  { key: 'productCount' as const, label: 'nav.products', icon: FiBox, tone: 'ink' },
  { key: 'categoryCount' as const, label: 'nav.categories', icon: FiTag, tone: 'gold' },
  { key: 'activeOfferCount' as const, label: 'activeOffers', icon: FiPercent, tone: 'gold' },
  { key: 'totalImages' as const, label: 'totalImages', icon: FiImage, tone: 'ink' },
];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: fetchDashboardStats });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.nav.dashboard')}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{t('admin.welcome')}</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <FiPlus /> {t('admin.addProduct')}
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
              <card.icon size={18} style={{ color: card.tone === 'gold' ? 'var(--color-gold)' : 'var(--color-coffee)' }} />
            </div>
            <p className="text-2xl font-extrabold">{isLoading ? '—' : data?.[card.key]?.toLocaleString('en-US')}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{t(`admin.${card.label}`)}</p>
          </motion.div>
        ))}
      </div>

      {!isLoading && data && data.newOrderCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-4" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
          <FiShoppingBag style={{ color: 'var(--color-gold)' }} />
          <p className="text-sm" style={{ color: 'var(--color-coffee)' }}>
            {t('admin.newOrder', { count: data.newOrderCount })}
          </p>
          <Link to="/admin/orders?status=new" className="text-sm font-semibold ms-auto flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
            {t('admin.view')} <FiArrowRight size={14} className="rtl-flip" />
          </Link>
        </div>
      )}

      {!isLoading && data && data.outOfStockCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-8" style={{ backgroundColor: 'rgba(220,38,38,0.06)' }}>
          <FiAlertTriangle style={{ color: '#dc2626' }} />
          <p className="text-sm" style={{ color: 'var(--color-coffee)' }}>
            {t('admin.outOfStock', { count: data.outOfStockCount })}
          </p>
          <Link to="/admin/products?status=out-of-stock" className="text-sm font-semibold ms-auto flex items-center gap-1" style={{ color: '#dc2626' }}>
            {t('admin.review')} <FiArrowRight size={14} className="rtl-flip" />
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-luxe p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold">{t('admin.recentProducts')}</h2>
            <Link to="/admin/products" className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--color-gold)' }}>
              {t('admin.viewAll')} <FiArrowRight size={14} className="rtl-flip" />
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading && <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</p>}
            {!isLoading && data?.recentProducts.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('admin.noProductsYet')}</p>
            )}
            {data?.recentProducts.map((p) => (
              <Link
                key={p.id}
                to={`/admin/products/${p.id}/edit`}
                className="flex items-center gap-4 p-2 rounded-xl hover:bg-black/5 transition-colors"
              >
                <img
                  src={p.images[0] ? cld(p.images[0], 100) : '/images/placeholder.svg'}
                  alt={p.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{p.brand}</p>
                </div>
                <p className="text-sm font-semibold shrink-0">{p.price.toLocaleString('en-US')} {p.currency}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="card-luxe p-6">
          <h2 className="font-bold mb-5">{t('admin.quickActions')}</h2>
          <div className="space-y-2">
            <Link to="/admin/products/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
              <FiBox size={16} style={{ color: 'var(--color-gold)' }} /> {t('admin.addAProduct')}
            </Link>
            <Link to="/admin/categories" className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
              <FiTag size={16} style={{ color: 'var(--color-gold)' }} /> {t('admin.manageCategories')}
            </Link>
            <Link to="/admin/offers/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 transition-colors text-sm font-medium">
              <FiPercent size={16} style={{ color: 'var(--color-gold)' }} /> {t('admin.createOffer')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
