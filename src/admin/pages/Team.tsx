import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiX, FiUsers } from 'react-icons/fi';
import { fetchAdmins, addAdmin, removeAdmin, getCurrentUserId } from '../../lib/api/admins';

export default function AdminTeam() {
  const queryClient = useQueryClient();
  const { data: admins = [], isLoading } = useQuery({ queryKey: ['admin', 'team'], queryFn: fetchAdmins });
  const { data: currentUserId } = useQuery({ queryKey: ['admin', 'current-user'], queryFn: getCurrentUserId });
  const [showAdd, setShowAdd] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });

  const onRemove = async (userId: string, name: string) => {
    if (admins.length <= 1) {
      alert("You can't remove the last remaining admin — the dashboard would become inaccessible.");
      return;
    }
    if (!confirm(`Remove "${name || userId}" from the dashboard? They'll lose access immediately.`)) return;
    await removeAdmin(userId);
    invalidate();
  };

  // Determine the owner: the earliest-added admin (smallest createdAt)
  const ownerId = admins.length
    ? admins.reduce((min, a) => (new Date(a.createdAt).getTime() < new Date(min.createdAt).getTime() ? a : min), admins[0]).userId
    : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Everyone with access to this dashboard. {admins.length} member{admins.length === 1 ? '' : 's'}.
          </p>
        </div>
        {/* Only the owner can add team members */}
        {currentUserId === ownerId && (
          <button onClick={() => setShowAdd(true)} className="btn-primary"><FiPlus /> Add Team Member</button>
        )}
      </div>


      {isLoading ? (
        <div className="card-luxe p-8 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>
      ) : (
        <div className="card-luxe overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: 'var(--color-border)' }}>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Added</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.userId} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3 font-medium">
                    {a.name || <span style={{ color: 'var(--color-muted)' }}>Unnamed</span>}
                    {a.userId === currentUserId && (
                      <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                        You
                      </span>
                    )}
                  </td>
                  <td className="p-3" style={{ color: 'var(--color-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    {/* Only the owner can remove team members. Also prevent removing yourself here. */}
                    {currentUserId === ownerId && a.userId !== currentUserId && (
                      <button onClick={() => onRemove(a.userId, a.name)} aria-label="Remove" className="hover:text-red-500 transition-colors">
                        <FiTrash2 size={15} />
                      </button>
                    )}
                    {a.userId === currentUserId && (
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>You</span>
                    )}
                    {currentUserId !== ownerId && a.userId !== currentUserId && (
                      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onSaved={() => { invalidate(); setShowAdd(false); }} />}
    </div>
  );
}

function AddAdminModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: currentUserId } = useQuery({ queryKey: ['admin', 'current-user'], queryFn: getCurrentUserId });
  const ownerId = undefined; // placeholder, will be checked by parent UI as well

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) { setError('Paste the User UID from Supabase.'); return; }
    setSaving(true);
    setError(null);
    try {
      // Double-check on the client that only owner can add — parent UI normally hides this modal for non-owners
      if (typeof currentUserId === 'undefined') throw new Error('Unable to verify permissions.');
      await addAdmin(userId, name);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add — check the UID is correct and not already added.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative card-luxe p-6 w-full max-w-md bg-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold flex items-center gap-2"><FiUsers /> Add Team Member</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input required value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User UID (from Supabase)" className="input-luxe font-mono text-sm" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Ahmed - Sales)" className="input-luxe" />
          {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Adding…' : 'Grant Dashboard Access'}</button>
        </form>
      </motion.div>
    </div>
  );
}
