import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiMail, FiAlertCircle } from 'react-icons/fi';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminLogin() {
  const { session, isAdmin, loading, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session && isAdmin) return <Navigate to="/admin" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email, password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    navigate('/admin');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, var(--color-cream) 0%, var(--color-blush) 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm card-luxe p-8 bg-white/95"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/images/logo.png" alt="Dr. Karam AbdelRazek" className="h-12 w-auto object-contain mb-2" />
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--color-gold)' }}>Admin Dashboard</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--color-muted)' }} />
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="input-luxe pl-11"
            />
          </div>
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--color-muted)' }} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-luxe pl-11"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs p-3 rounded-xl" style={{ backgroundColor: 'rgba(220,38,38,0.08)', color: '#dc2626' }}>
              <FiAlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
