import { motion } from 'framer-motion';
import type { IconType } from 'react-icons';
import { Link } from 'react-router-dom';
import Button from './Button';

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo }: {
  icon: IconType; title: string; description: string; actionLabel?: string; actionTo?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center py-20 px-6"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}
      >
        <Icon size={32} style={{ color: 'var(--color-gold)' }} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="max-w-sm mb-8" style={{ color: 'var(--color-muted)' }}>{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo}>
          <Button variant="primary">{actionLabel}</Button>
        </Link>
      )}
    </motion.div>
  );
}
