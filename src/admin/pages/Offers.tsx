import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiEdit2, FiTrash2, FiPercent } from 'react-icons/fi';
import { fetchOffers, deleteOffer, setOfferEnabled, isOfferActive, getBogoLabel } from '../../lib/api/offers';
import { fetchCategoryRows } from '../../lib/api/categories';

export default function AdminOffers() {
  const queryClient = useQueryClient();
  const { data: offers = [], isLoading } = useQuery({ queryKey: ['admin', 'offers'], queryFn: fetchOffers });
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories-raw'], queryFn: fetchCategoryRows });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'offers'] });

  const onDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await deleteOffer(id);
    invalidate();
  };

  const onToggle = async (id: string, current: boolean) => {
    await setOfferEnabled(id, !current);
    invalidate();
  };

  const discountLabel = (offer: (typeof offers)[number]) => {
    if (offer.discountType === 'bogo') return getBogoLabel(offer);
    return offer.discountType === 'percent' ? `${offer.discountValue}% Off` : `${offer.discountValue} EGP Off`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Offers</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{offers.length} offers</p>
        </div>
        <Link to="/admin/offers/new" className="btn-primary"><FiPlus /> Create Offer</Link>
      </div>

      {isLoading ? (
        <div className="card-luxe p-8 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>
      ) : offers.length === 0 ? (
        <div className="card-luxe p-10 text-center">
          <FiPercent size={28} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
          <p className="font-medium">No offers yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Create your first offer to start discounting products.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {offers.map((offer) => {
            const active = isOfferActive(offer);
            const target = offer.targetType === 'category'
              ? categories.find((c) => c.id === offer.categoryId)?.name ?? '—'
              : `${offer.productIds?.length ?? 0} product(s)`;
            return (
              <div key={offer.id} className="card-luxe overflow-hidden">
                {offer.bannerImage ? (
                  <img src={offer.bannerImage} alt={offer.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center" style={{ backgroundColor: 'var(--color-blush)' }}>
                    <FiPercent size={22} style={{ color: 'var(--color-gold)' }} />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold line-clamp-1">{offer.title}</h3>
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                      style={{
                        backgroundColor: active ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                        color: active ? '#16a34a' : 'var(--color-muted)',
                      }}
                    >
                      {active ? 'ACTIVE' : offer.isEnabled ? 'SCHEDULED/EXPIRED' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-gold)' }}>{discountLabel(offer)}</p>
                  <p className="text-xs mb-1 capitalize" style={{ color: 'var(--color-muted)' }}>{offer.targetType === 'category' ? 'Category' : 'Products'}: {target}</p>
                  <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
                    {new Date(offer.startDate).toLocaleDateString()} – {new Date(offer.endDate).toLocaleDateString()}
                  </p>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onToggle(offer.id, offer.isEnabled)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: offer.isEnabled ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                        color: offer.isEnabled ? '#16a34a' : 'var(--color-muted)',
                      }}
                    >
                      {offer.isEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <div className="flex items-center gap-3">
                      <Link to={`/admin/offers/${offer.id}/edit`} aria-label="Edit" className="hover:text-[var(--color-gold)] transition-colors">
                        <FiEdit2 size={15} />
                      </Link>
                      <button onClick={() => onDelete(offer.id, offer.title)} aria-label="Delete" className="hover:text-red-500 transition-colors">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
