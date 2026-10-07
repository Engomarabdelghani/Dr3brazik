import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiX, FiUsers, FiKey } from 'react-icons/fi';
import { fetchAdmins, addAdmin, removeAdmin, resetAdminPassword } from '../../lib/api/admins';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { TeamMember } from '../../api/types';

const MIN_PASSWORD = 10;

export default function AdminTeam() {
  const queryClient = useQueryClient();
  const { data: admins = [], isLoading } = useQuery({ queryKey: ['admin', 'team'], queryFn: fetchAdmins });
  const { admin: me, isOwner } = useAdminAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [resetFor, setResetFor] = useState<TeamMember | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'team'] });

  const onRemove = async (member: TeamMember) => {
    if (!confirm(`Remove "${member.name || member.email}" from the dashboard? They'll lose access immediately.`)) return;
    try {
      await removeAdmin(member.id);
      invalidate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove this team member.');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Everyone with access to this dashboard. {admins.length} member{admins.length === 1 ? '' : 's'}.
          </p>
        </div>
        {/* Only the owner can add team members (enforced by the server too) */}
        {isOwner && (
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
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Added</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isMe = a.id === me?.id;
                return (
                  <tr key={a.id} className="border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="p-3 font-medium">
                      {a.name || <span style={{ color: 'var(--color-muted)' }}>Unnamed</span>}
                      {a.role === 'owner' && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,162,39,0.15)', color: 'var(--color-gold)' }}>
                          Owner
                        </span>
                      )}
                      {isMe && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
                          You
                        </span>
                      )}
                    </td>
                    <td className="p-3" style={{ color: 'var(--color-muted)' }}>{a.email}</td>
                    <td className="p-3" style={{ color: 'var(--color-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {isOwner ? (
                        <div className="inline-flex items-center gap-3">
                          <button onClick={() => setResetFor(a)} aria-label="Reset password" title="Reset password" className="hover:text-[var(--color-gold)] transition-colors">
                            <FiKey size={15} />
                          </button>
                          {!isMe && a.role !== 'owner' && (
                            <button onClick={() => onRemove(a)} aria-label="Remove" title="Remove" className="hover:text-red-500 transition-colors">
                              <FiTrash2 size={15} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{isMe ? 'You' : '—'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onSaved={() => { invalidate(); setShowAdd(false); }} />}
      {resetFor && <ResetPasswordModal member={resetFor} isSelf={resetFor.id === me?.id} onClose={() => setResetFor(null)} />}
    </div>
  );
}

function ModalShell({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative card-luxe p-6 w-full max-w-md bg-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold flex items-center gap-2">{icon} {title}</h3>
          <button onClick={onClose} aria-label="Close"><FiX size={18} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function AddAdminModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) { setError(`Password must be at least ${MIN_PASSWORD} characters.`); return; }
    setSaving(true);
    setError(null);
    try {
      await addAdmin({ name: name.trim(), email: email.trim(), password });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this team member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Add Team Member" icon={<FiUsers />} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (e.g. Ahmed - Sales)" className="input-luxe" />
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-luxe" autoComplete="off" />
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`Password (min ${MIN_PASSWORD} characters)`} className="input-luxe" autoComplete="new-password" />
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Share the password with them privately. They can sign in straight away.</p>
        {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Adding…' : 'Grant Dashboard Access'}</button>
      </form>
    </ModalShell>
  );
}

function ResetPasswordModal({ member, isSelf, onClose }: { member: TeamMember; isSelf: boolean; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) { setError(`Password must be at least ${MIN_PASSWORD} characters.`); return; }
    setSaving(true);
    setError(null);
    try {
      await resetAdminPassword(member.id, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset the password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Reset password — ${member.name || member.email}`} icon={<FiKey />} onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <p className="text-sm">
            Password updated. {isSelf ? 'You will be asked to sign in again.' : 'They have been signed out everywhere and must use the new password.'}
          </p>
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`New password (min ${MIN_PASSWORD} characters)`} className="input-luxe" autoComplete="new-password" />
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {isSelf ? 'This signs you out on every device, including this one.' : 'This signs them out on every device.'}
          </p>
          {error && <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Set New Password'}</button>
        </form>
      )}
    </ModalShell>
  );
}
