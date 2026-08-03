import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FiPlus, FiEdit2, FiTrash2, FiCopy, FiEye, FiEyeOff, FiSearch, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { fetchAdminProducts, deleteProduct, duplicateProduct, setProductVisibility, type AdminProductQuery } from '../../../lib/api/products';
import { fetchCategoryRows } from '../../../lib/api/categories';
import { cld } from '../../../utils/cloudinary';

const PAGE_SIZE = 20;

export default function ProductsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const search = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('category') ?? '';
  const status = (searchParams.get('status') as AdminProductQuery['status']) ?? 'all';
  const sortBy = (searchParams.get('sortBy') as AdminProductQuery['sortBy']) ?? 'created_at';
  const sortDir = (searchParams.get('sortDir') as AdminProductQuery['sortDir']) ?? 'desc';
  const page = Number(searchParams.get('page') ?? '1');

  const [searchInput, setSearchInput] = useState(search);

  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories-raw'], queryFn: fetchCategoryRows });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', { search, categoryId, status, sortBy, sortDir, page }],
    queryFn: () =>
      fetchAdminProducts({
        search, categoryId: categoryId || undefined, status, sortBy, sortDir, page, pageSize: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteProduct(id);
    invalidate();
  };

  const onDuplicate = async (id: string) => {
    await duplicateProduct(id);
    invalidate();
  };

  const onToggleVisible = async (id: string, current: boolean) => {
    await setProductVisibility(id, !current);
    invalidate();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{data?.total ?? '—'} total products</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary"><FiPlus /> Add Product</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form onSubmit={submitSearch} className="relative flex-1 min-w-[220px]">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2" size={15} style={{ color: 'var(--color-muted)' }} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, brand, or SKU…"
            className="input-luxe pl-10"
          />
        </form>

        <select value={categoryId} onChange={(e) => updateParam('category', e.target.value)} className="input-luxe w-auto">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={status} onChange={(e) => updateParam('status', e.target.value)} className="input-luxe w-auto">
          <option value="all">All Status</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>

        <select
          value={`${sortBy}:${sortDir}`}
          onChange={(e) => {
            const [sb, sd] = e.target.value.split(':');
            const next = new URLSearchParams(searchParams);
            next.set('sortBy', sb); next.set('sortDir', sd); next.delete('page');
            setSearchParams(next);
          }}
          className="input-luxe w-auto"
        >
          <option value="created_at:desc">Newest First</option>
          <option value="created_at:asc">Oldest First</option>
          <option value="name:asc">Name: A-Z</option>
          <option value="name:desc">Name: Z-A</option>
          <option value="price:asc">Price: Low to High</option>
          <option value="price:desc">Price: High to Low</option>
          <option value="stock:asc">Stock: Low to High</option>
        </select>
      </div>

      <div className="card-luxe overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)' }}>
              <th className="p-3 font-semibold">Image</th>
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Brand</th>
              <th className="p-3 font-semibold">Category</th>
              <th className="p-3 font-semibold">Price</th>
              <th className="p-3 font-semibold">Stock</th>
              <th className="p-3 font-semibold">Featured</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="p-8 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</td></tr>
            )}
            {!isLoading && data?.products.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center" style={{ color: 'var(--color-muted)' }}>No products found.</td></tr>
            )}
            {data?.products.map((p) => (
              <tr key={p.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                <td className="p-3">
                  <img
                    src={p.images[0] ? cld(p.images[0], 80) : 'https://picsum.photos/seed/placeholder/80/80'}
                    alt={p.name}
                    className="w-11 h-11 rounded-lg object-cover"
                  />
                </td>
                <td className="p-3 max-w-[220px]">
                  <p className="font-medium line-clamp-1">{p.name}</p>
                  {p.sku && <p className="text-xs" style={{ color: 'var(--color-muted)' }}>SKU: {p.sku}</p>}
                </td>
                <td className="p-3" style={{ color: 'var(--color-muted)' }}>{p.brand}</td>
                <td className="p-3 capitalize">{categories.find((c) => c.id === p.categoryId)?.name ?? '—'}</td>
                <td className="p-3">
                  <p className="font-semibold">{p.price.toLocaleString()} {p.currency}</p>
                  {p.oldPrice && <p className="text-xs line-through" style={{ color: 'var(--color-muted)' }}>{p.oldPrice.toLocaleString()}</p>}
                </td>
                <td className="p-3">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: (p.stock ?? 0) > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      color: (p.stock ?? 0) > 0 ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {p.stock ?? 0}
                  </span>
                </td>
                <td className="p-3">
                  {p.isFeatured ? <span style={{ color: 'var(--color-gold)' }}>★</span> : <span style={{ color: 'var(--color-border)' }}>☆</span>}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onToggleVisible(p.id, p.isVisible ?? true)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit"
                    style={{
                      backgroundColor: p.isVisible ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                      color: p.isVisible ? '#16a34a' : 'var(--color-muted)',
                    }}
                  >
                    {p.isVisible ? <FiEye size={12} /> : <FiEyeOff size={12} />} {p.isVisible ? 'Visible' : 'Hidden'}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link to={`/admin/products/${p.id}/edit`} aria-label="Edit" className="hover:text-[var(--color-gold)] transition-colors">
                      <FiEdit2 size={15} />
                    </Link>
                    <button onClick={() => onDuplicate(p.id)} aria-label="Duplicate" className="hover:text-[var(--color-gold)] transition-colors">
                      <FiCopy size={15} />
                    </button>
                    <button onClick={() => onDelete(p.id, p.name)} aria-label="Delete" className="hover:text-red-500 transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => updateParam('page', String(page - 1))}
            className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <FiChevronLeft size={16} />
          </button>
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => updateParam('page', String(page + 1))}
            className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
