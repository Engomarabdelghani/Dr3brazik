import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiTruck } from 'react-icons/fi';
import {
  fetchShippingZones, createShippingZone, updateShippingZone, deleteShippingZone, type ShippingZoneInput,
} from '../../lib/api/shippingZones';
import type { ShippingZone } from '../../types';

export default function AdminShippingZones() {
  const queryClient = useQueryClient();
  const { data: zones = [], isLoading } = useQuery({ queryKey: ['admin', 'shipping-zones'], queryFn: fetchShippingZones });
  const [editing, setEditing] = useState<ShippingZone | 'new' | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-zones'] });
    queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
  };

  const onDelete = async (zone: ShippingZone) => {
    if (!confirm(`Delete "${zone.name}"?`)) return;
    await deleteShippingZone(zone.id);
    invalidate();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shipping Zones</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Governorates and their delivery price — shown as a dropdown at Checkout. {zones.length} zones.
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary"><FiPlus /> Add Zone</button>
      </div>

      {isLoading ? (
        <div className="card-luxe p-8 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>
      ) : zones.length === 0 ? (
        <div className="card-luxe p-10 text-center">
          <FiTruck size={28} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
          <p className="font-medium">No shipping zones yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>Add governorates and delivery prices for Checkout.</p>
        </div>
      ) : (
        <div className="card-luxe overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)' }}>
                <th className="p-3 font-semibold">Governorate</th>
                <th className="p-3 font-semibold">Delivery Price</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3 font-medium">{z.name}</td>
                  <td className="p-3">{z.price.toLocaleString()} EGP</td>
                  <td className="p-3">
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: z.isEnabled ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                        color: z.isEnabled ? '#16a34a' : 'var(--color-muted)',
                      }}
                    >
                      {z.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => setEditing(z)} aria-label="Edit" className="hover:text-[var(--color-gold)] transition-colors">
                        <FiEdit2 size={15} />
                      </button>
                      <button onClick={() => onDelete(z)} aria-label="Delete" className="hover:text-red-500 transition-colors">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ZoneModal
          zone={editing === 'new' ? null : editing}
          nextSortOrder={zones.length}
          onClose={() => setEditing(null)}
          onSaved={() => { invalidate(); setEditing(null); }}
        />
      )}
    </div>
  );
}

function ZoneModal({ zone, nextSortOrder, onClose, onSaved }: {
  zone: ShippingZone | null; nextSortOrder: number; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(zone?.name ?? '');
  const [price, setPrice] = useState(String(zone?.price ?? '60'));
  const [sortOrder, setSortOrder] = useState(String(zone?.sortOrder ?? nextSortOrder));
  const [isEnabled, setIsEnabled] = useState(zone?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input: ShippingZoneInput = { name: name.trim(), price: Number(price) || 0, sortOrder: Number(sortOrder) || 0, isEnabled };
      if (zone) await updateShippingZone(zone.id, input);
      else await createShippingZone(input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save zone.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative card-luxe p-6 w-full max-w-sm bg-white"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold">{zone ? 'Edit Zone' : 'Add Zone'}</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Governorate name (e.g. القاهرة)" className="input-luxe" dir="auto" />
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>Delivery Price (EGP)</label>
            <input type="number" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} className="input-luxe" />
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
