import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiMessageSquare } from 'react-icons/fi';
import {
  fetchTestimonials, createTestimonial, updateTestimonial, deleteTestimonial, type TestimonialInput,
} from '../../lib/api/testimonials';
import type { Testimonial } from '../../types';
import SingleImageUploader from '../components/SingleImageUploader';

export default function AdminTestimonials() {
  const queryClient = useQueryClient();
  const { data: testimonials = [], isLoading } = useQuery({ queryKey: ['admin', 'testimonials'], queryFn: fetchTestimonials });
  const [editing, setEditing] = useState<Testimonial | 'new' | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
    queryClient.invalidateQueries({ queryKey: ['testimonials'] });
  };

  const onDelete = async (t: Testimonial) => {
    if (!confirm('Delete this testimonial?')) return;
    await deleteTestimonial(t.id);
    invalidate();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Testimonials</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Real customer testimonials shown on the Home page — upload a screenshot (WhatsApp message, review site,
            etc.). {testimonials.length} testimonials.
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary"><FiPlus /> Add Testimonial</button>
      </div>

      {isLoading ? (
        <div className="card-luxe p-8 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>
      ) : testimonials.length === 0 ? (
        <div className="card-luxe p-10 text-center">
          <FiMessageSquare size={28} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
          <p className="font-medium">No testimonials yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Upload a screenshot to feature it on the Home page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {testimonials.map((t) => (
            <div key={t.id} className="card-luxe overflow-hidden">
              <img src={t.image} alt="" className="w-full h-40 object-cover" />
              <div className="p-2.5">
                <p className="text-[10px] font-bold" style={{ color: t.isEnabled ? '#16a34a' : 'var(--color-muted)' }}>
                  {t.isEnabled ? 'ENABLED' : 'DISABLED'} · #{t.sortOrder}
                </p>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <button onClick={() => setEditing(t)} aria-label="Edit" className="hover:text-[var(--color-gold)] transition-colors">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(t)} aria-label="Delete" className="hover:text-red-500 transition-colors">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TestimonialModal
          testimonial={editing === 'new' ? null : editing}
          nextSortOrder={testimonials.length}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}
    </div>
  );
}

function TestimonialModal({ testimonial, nextSortOrder, onClose, onSaved }: {
  testimonial: Testimonial | null; nextSortOrder: number; onClose: () => void; onSaved: () => void;
}) {
  const [image, setImage] = useState(testimonial?.image ?? '');
  const [sortOrder, setSortOrder] = useState(String(testimonial?.sortOrder ?? nextSortOrder));
  const [isEnabled, setIsEnabled] = useState(testimonial?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError('Please upload a screenshot.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const input: TestimonialInput = { image, sortOrder: Number(sortOrder) || 0, isEnabled };
      if (testimonial) await updateTestimonial(testimonial.id, input);
      else await createTestimonial(input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save testimonial.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative card-luxe p-6 w-full max-w-sm bg-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold">{testimonial ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs mb-1.5 block font-semibold" style={{ color: 'var(--color-heading)' }}>
              Screenshot — required
            </label>
            <p className="text-[11px] mb-2" style={{ color: 'var(--color-muted)' }}>
              A WhatsApp message, DM, or review site screenshot from a real customer.
            </p>
            <SingleImageUploader value={image} onChange={setImage} folder="testimonials" aspectClassName="aspect-[4/5]" />
          </div>

          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>Sort Order</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="input-luxe" />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="w-4 h-4 accent-[var(--color-gold)]" />
            <span className="text-sm font-medium">Enabled</span>
          </label>

          {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save'}</button>
        </form>
      </motion.div>
    </div>
  );
}
