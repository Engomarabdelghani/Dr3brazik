import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import Button from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container-luxe py-28 flex flex-col items-center text-center">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-8xl md:text-9xl font-extrabold"
        style={{ color: 'var(--color-gold)' }}
      >
        404
      </motion.h1>
      <h2 className="text-2xl font-bold mt-6">{t('notFound.title')}</h2>
      <p className="mt-3 max-w-sm" style={{ color: 'var(--color-muted)' }}>
        {t('notFound.description')}
      </p>
      <Link to="/" className="mt-8">
        <Button variant="primary"><FiArrowLeft className="rtl-flip" /> {t('notFound.backHome')}</Button>
      </Link>
    </div>
  );
}
