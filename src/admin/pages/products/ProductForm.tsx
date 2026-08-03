import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { fetchCategoryRows, fetchSubcategoryRows } from '../../../lib/api/categories';
import { fetchProductById, createProduct, updateProduct, type ProductInput } from '../../../lib/api/products';
import type { ProductImage } from '../../../types';
import ImageManager from '../../components/ImageManager';

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const listToText = (arr?: string[]) => (arr ?? []).join(', ');
const textToList = (s: string) => s.split(',').map((v) => v.trim()).filter(Boolean);

const emptyForm = {
  name: '', nameAr: '', slug: '', brand: '', categoryId: '', subcategoryId: '',
  description: '', shortDescription: '', ingredients: '', howToUse: '', warnings: '', benefits: '', tags: '',
  price: '', oldPrice: '', currency: 'EGP', discountPercent: '', stock: '0', sku: '', barcode: '',
  isFeatured: false, isBestSeller: false, isNew: false, isVisible: true,
  metaTitle: '', metaDescription: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories-raw'], queryFn: fetchCategoryRows });
  const { data: subcategories = [] } = useQuery({ queryKey: ['admin', 'subcategories-raw'], queryFn: fetchSubcategoryRows });
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => fetchProductById(id!),
    enabled: isEdit,
  });

  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing) return;
    setForm({
      name: existing.name, nameAr: existing.nameAr ?? '', slug: existing.slug, brand: existing.brand,
      categoryId: existing.categoryId ?? '', subcategoryId: existing.subcategoryId ?? '',
      description: existing.description, shortDescription: existing.shortDescription,
      ingredients: listToText(existing.ingredients), howToUse: existing.howToUse ?? '', warnings: existing.warnings ?? '',
      benefits: listToText(existing.benefits), tags: listToText(existing.tags),
      price: String(existing.price), oldPrice: existing.oldPrice ? String(existing.oldPrice) : '',
      currency: existing.currency, discountPercent: existing.discountPercent ? String(existing.discountPercent) : '',
      stock: String(existing.stock ?? 0), sku: existing.sku ?? '', barcode: existing.barcode ?? '',
      isFeatured: existing.isFeatured ?? false, isBestSeller: existing.isBestSeller ?? false,
      isNew: existing.isNew ?? false, isVisible: existing.isVisible ?? true,
      metaTitle: existing.metaTitle ?? '', metaDescription: existing.metaDescription ?? '',
    });
    setImages(existing.imageObjects ?? []);
  }, [existing]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const relevantSubcategories = subcategories.filter((s) => s.category_id === form.categoryId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.categoryId || !form.price) {
      setError('Name, category and price are required.');
      return;
    }
    if (images.length === 0) {
      setError('Add at least one product image.');
      return;
    }

    setSaving(true);
    try {
      const input: ProductInput = {
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || undefined,
        slug: form.slug.trim() || slugify(form.name),
        brand: form.brand.trim(),
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || undefined,
        description: form.description,
        shortDescription: form.shortDescription,
        ingredients: textToList(form.ingredients),
        howToUse: form.howToUse,
        warnings: form.warnings,
        benefits: textToList(form.benefits),
        tags: textToList(form.tags),
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        currency: form.currency || 'EGP',
        discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined,
        stock: Number(form.stock) || 0,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        isFeatured: form.isFeatured,
        isBestSeller: form.isBestSeller,
        isNew: form.isNew,
        isVisible: form.isVisible,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        images,
      };

      if (isEdit) await updateProduct(id!, input);
      else await createProduct(input);

      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loadingExisting) {
    return <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Loading product…</p>;
  }

  return (
    <div>
      <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:text-[var(--color-gold)] transition-colors">
        <FiArrowLeft /> Back to Products
      </Link>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Product' : 'Add Product'}</h1>

      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-luxe p-6 space-y-4">
            <h2 className="font-semibold">Basic Info</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Product Name" className="input-luxe" />
              <input value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} placeholder="Arabic Name (optional)" className="input-luxe" dir="rtl" />
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="URL slug (auto-generated if blank)" className="input-luxe" />
              <input required value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Brand" className="input-luxe" />
              <select required value={form.categoryId} onChange={(e) => { set('categoryId', e.target.value); set('subcategoryId', ''); }} className="input-luxe">
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.subcategoryId} onChange={(e) => set('subcategoryId', e.target.value)} className="input-luxe" disabled={!form.categoryId}>
                <option value="">No Subcategory</option>
                {relevantSubcategories.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <textarea value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} placeholder="Short description (shown on product cards)" rows={2} className="input-luxe" />
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Full description" rows={4} className="input-luxe" />
          </div>

          <div className="card-luxe p-6 space-y-4">
            <h2 className="font-semibold">Images</h2>
            <ImageManager images={images} onChange={setImages} folder={form.slug || slugify(form.name) || 'misc'} />
          </div>

          <div className="card-luxe p-6 space-y-4">
            <h2 className="font-semibold">Details</h2>
            <input value={form.ingredients} onChange={(e) => set('ingredients', e.target.value)} placeholder="Ingredients (comma separated)" className="input-luxe" />
            <input value={form.benefits} onChange={(e) => set('benefits', e.target.value)} placeholder="Benefits (comma separated)" className="input-luxe" />
            <textarea value={form.howToUse} onChange={(e) => set('howToUse', e.target.value)} placeholder="How to use" rows={2} className="input-luxe" />
            <textarea value={form.warnings} onChange={(e) => set('warnings', e.target.value)} placeholder="Warnings" rows={2} className="input-luxe" />
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="Tags (comma separated)" className="input-luxe" />
          </div>

          <div className="card-luxe p-6 space-y-4">
            <h2 className="font-semibold">SEO</h2>
            <input value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} placeholder="Meta Title" className="input-luxe" />
            <textarea value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} placeholder="Meta Description" rows={2} className="input-luxe" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-luxe p-6 space-y-4">
            <h2 className="font-semibold">Pricing</h2>
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="Price" className="input-luxe" />
            <input type="number" min="0" step="0.01" value={form.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} placeholder="Old Price (optional)" className="input-luxe" />
            <input type="number" min="0" max="100" value={form.discountPercent} onChange={(e) => set('discountPercent', e.target.value)} placeholder="Discount %" className="input-luxe" />
            <input value={form.currency} onChange={(e) => set('currency', e.target.value)} placeholder="Currency" className="input-luxe" />
          </div>

          <div className="card-luxe p-6 space-y-4">
            <h2 className="font-semibold">Inventory</h2>
            <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="Stock quantity" className="input-luxe" />
            <input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="SKU" className="input-luxe" />
            <input value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="Barcode" className="input-luxe" />
          </div>

          <div className="card-luxe p-6 space-y-3">
            <h2 className="font-semibold mb-1">Flags</h2>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.isVisible} onChange={(e) => set('isVisible', e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
              <span className="text-sm">Visible on site</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
              <span className="text-sm">Featured</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.isBestSeller} onChange={(e) => set('isBestSeller', e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
              <span className="text-sm">Best Seller</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.isNew} onChange={(e) => set('isNew', e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
              <span className="text-sm">New Arrival</span>
            </label>
          </div>

          {error && (
            <div className="text-xs p-3 rounded-xl" style={{ backgroundColor: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>{error}</div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            <FiSave /> {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
