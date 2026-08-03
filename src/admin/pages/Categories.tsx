import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiChevronDown } from 'react-icons/fi';
import {
  fetchCategoryRows, fetchSubcategoryRows, createCategory, updateCategory, deleteCategory,
  createSubcategory, updateSubcategory, deleteSubcategory, type CategoryRow, type SubcategoryRow,
} from '../../lib/api/categories';

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery({ queryKey: ['admin', 'categories-raw'], queryFn: fetchCategoryRows });
  const { data: subcategories = [] } = useQuery({ queryKey: ['admin', 'subcategories-raw'], queryFn: fetchSubcategoryRows });

  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | 'new' | null>(null);
  const [editingSub, setEditingSub] = useState<{ categoryId: string; sub: SubcategoryRow | 'new' } | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories-raw'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'subcategories-raw'] });
  };

  const onDeleteCategory = async (cat: CategoryRow) => {
    if (!confirm(`Delete "${cat.name}"? Products in this category will keep their data but lose their category link.`)) return;
    await deleteCategory(cat.id);
    invalidate();
  };

  const onDeleteSub = async (sub: SubcategoryRow) => {
    if (!confirm(`Delete "${sub.name}"?`)) return;
    await deleteSubcategory(sub.id);
    invalidate();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{categories.length} categories</p>
        </div>
        <button onClick={() => setEditingCategory('new')} className="btn-primary"><FiPlus /> Add Category</button>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const subs = subcategories.filter((s) => s.category_id === cat.id);
          const isOpen = expanded === cat.id;
          return (
            <div key={cat.id} className="card-luxe overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <img src={cat.image ?? undefined} alt={cat.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{cat.slug} · {subs.length} subcategories</p>
                </div>
                <button onClick={() => setExpanded(isOpen ? null : cat.id)} className="p-2" aria-label="Toggle subcategories">
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="block"><FiChevronDown /></motion.span>
                </button>
                <button onClick={() => setEditingCategory(cat)} aria-label="Edit category" className="hover:text-[var(--color-gold)] transition-colors">
                  <FiEdit2 size={16} />
                </button>
                <button onClick={() => onDeleteCategory(cat)} aria-label="Delete category" className="hover:text-red-500 transition-colors">
                  <FiTrash2 size={16} />
                </button>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="p-4 space-y-2">
                      {subs.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5">
                          <span className="text-sm">{sub.name} <span style={{ color: 'var(--color-muted)' }}>({sub.slug})</span></span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => setEditingSub({ categoryId: cat.id, sub })} className="hover:text-[var(--color-gold)] transition-colors">
                              <FiEdit2 size={13} />
                            </button>
                            <button onClick={() => onDeleteSub(sub)} className="hover:text-red-500 transition-colors">
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setEditingSub({ categoryId: cat.id, sub: 'new' })}
                        className="text-sm font-semibold flex items-center gap-1.5 px-3 py-2"
                        style={{ color: 'var(--color-gold)' }}
                      >
                        <FiPlus size={13} /> Add Subcategory
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {editingCategory && (
        <CategoryModal
          category={editingCategory === 'new' ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => { invalidate(); setEditingCategory(null); }}
        />
      )}

      {editingSub && (
        <SubcategoryModal
          categoryId={editingSub.categoryId}
          sub={editingSub.sub === 'new' ? null : editingSub.sub}
          onClose={() => setEditingSub(null)}
          onSaved={() => { invalidate(); setEditingSub(null); }}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, onClose, onSaved }: { category: CategoryRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? '');
  const [nameAr, setNameAr] = useState(category?.name_ar ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [image, setImage] = useState(category?.image ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input = { name, nameAr: nameAr || undefined, slug: slug || slugify(name), image: image || undefined };
      if (category) await updateCategory(category.id, input);
      else await createCategory(input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={category ? 'Edit Category' : 'Add Category'}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input-luxe" />
        <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="Arabic Name (optional)" className="input-luxe" dir="rtl" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug (auto-generated if blank)" className="input-luxe" />
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Image URL" className="input-luxe" />
        {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </Modal>
  );
}

function SubcategoryModal({ categoryId, sub, onClose, onSaved }: {
  categoryId: string; sub: SubcategoryRow | null; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(sub?.name ?? '');
  const [slug, setSlug] = useState(sub?.slug ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input = { name, slug: slug || slugify(name) };
      if (sub) await updateSubcategory(sub.id, input);
      else await createSubcategory(categoryId, input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subcategory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={sub ? 'Edit Subcategory' : 'Add Subcategory'}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="input-luxe" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug (auto-generated if blank)" className="input-luxe" />
        {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save'}</button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative card-luxe p-6 w-full max-w-sm bg-white"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
