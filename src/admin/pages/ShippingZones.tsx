import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiTruck, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import {
  fetchShippingZones, createShippingZone, updateShippingZone, deleteShippingZone, type ShippingZoneInput,
  createShippingCity, updateShippingCity, deleteShippingCity, type ShippingCityInput,
} from '../../lib/api/shippingZones';
import type { ShippingZone, ShippingCity } from '../../types';

export default function AdminShippingZones() {
  const queryClient = useQueryClient();
  const { data: zones = [], isLoading } = useQuery({ queryKey: ['admin', 'shipping-zones'], queryFn: fetchShippingZones });
  const [editing, setEditing] = useState<ShippingZone | 'new' | null>(null);
  const [cityEditing, setCityEditing] = useState<{ zone: ShippingZone; city: ShippingCity | null } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-zones'] });
    queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const onDelete = async (zone: ShippingZone) => {
    if (!confirm(`Delete "${zone.name}"? Its cities will be deleted too.`)) return;
    await deleteShippingZone(zone.id);
    invalidate();
  };

  const onDeleteCity = async (city: ShippingCity) => {
    if (!confirm(`Delete "${city.name}"?`)) return;
    await deleteShippingCity(city.id);
    invalidate();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shipping Zones</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Governorates and their delivery price. Add cities inside a governorate to charge a different price per
            city — a governorate with no cities just uses its own price. {zones.length} governorates.
          </p>
        </div>
        <button onClick={() => setEditing('new')} className="btn-primary"><FiPlus /> Add Governorate</button>
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
        <div className="space-y-3">
          {zones.map((z) => {
            const isOpen = expanded.has(z.id);
            const cities = z.cities ?? [];
            return (
              <div key={z.id} className="card-luxe overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => toggleExpand(z.id)} aria-label="Toggle cities" className="shrink-0">
                    {isOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{z.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                      {cities.length > 0
                        ? `${cities.length} cit${cities.length === 1 ? 'y' : 'ies'} — price set per city`
                        : `${z.price.toLocaleString('en-US')} EGP — flat for the whole governorate`}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                    style={{
                      backgroundColor: z.isEnabled ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                      color: z.isEnabled ? '#16a34a' : 'var(--color-muted)',
                    }}
                  >
                    {z.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => setEditing(z)} aria-label="Edit" className="hover:text-[var(--color-gold)] transition-colors">
                      <FiEdit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(z)} aria-label="Delete" className="hover:text-red-500 transition-colors">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 pl-11" style={{ backgroundColor: 'var(--color-cream)' }}>
                    <div className="flex items-center justify-between py-3">
                      <p className="text-xs font-semibold">Cities</p>
                      <button onClick={() => setCityEditing({ zone: z, city: null })} className="btn-secondary text-xs">
                        <FiPlus size={12} /> Add City
                      </button>
                    </div>
                    {cities.length === 0 ? (
                      <p className="text-xs pb-2" style={{ color: 'var(--color-muted)' }}>
                        No cities — the governorate price above is used for the whole area.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {cities.map((c) => (
                          <div key={c.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2">
                            <span className="flex-1 text-sm truncate">{c.name}</span>
                            <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>
                              {c.price.toLocaleString('en-US')} EGP
                            </span>
                            <span
                              className="text-[10px] font-bold shrink-0"
                              style={{ color: c.isEnabled ? '#16a34a' : 'var(--color-muted)' }}
                            >
                              {c.isEnabled ? 'ON' : 'OFF'}
                            </span>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <button onClick={() => setCityEditing({ zone: z, city: c })} aria-label="Edit city" className="hover:text-[var(--color-gold)] transition-colors">
                                <FiEdit2 size={13} />
                              </button>
                              <button onClick={() => onDeleteCity(c)} aria-label="Delete city" className="hover:text-red-500 transition-colors">
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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

      {cityEditing && (
        <CityModal
          zone={cityEditing.zone}
          city={cityEditing.city}
          nextSortOrder={cityEditing.zone.cities?.length ?? 0}
          onClose={() => setCityEditing(null)}
          onSaved={() => { invalidate(); setCityEditing(null); }}
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
          <h3 className="font-bold">{zone ? 'Edit Governorate' : 'Add Governorate'}</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Governorate name (e.g. القاهرة)" className="input-luxe" dir="auto" />
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--color-muted)' }}>Delivery Price (EGP)</label>
            <input type="number" min="0" required value={price} onChange={(e) => setPrice(e.target.value)} className="input-luxe" />
            <p className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
              Used only when this governorate has no cities added.
            </p>
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

function CityModal({ zone, city, nextSortOrder, onClose, onSaved }: {
  zone: ShippingZone; city: ShippingCity | null; nextSortOrder: number; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(city?.name ?? '');
  const [price, setPrice] = useState(String(city?.price ?? zone.price));
  const [sortOrder, setSortOrder] = useState(String(city?.sortOrder ?? nextSortOrder));
  const [isEnabled, setIsEnabled] = useState(city?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input: ShippingCityInput = {
        zoneId: zone.id, name: name.trim(), price: Number(price) || 0,
        sortOrder: Number(sortOrder) || 0, isEnabled,
      };
      if (city) await updateShippingCity(city.id, input);
      else await createShippingCity(input);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save city.');
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
          <h3 className="font-bold">{city ? 'Edit City' : `Add City to ${zone.name}`}</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="City name (e.g. بنها)" className="input-luxe" dir="auto" />
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
