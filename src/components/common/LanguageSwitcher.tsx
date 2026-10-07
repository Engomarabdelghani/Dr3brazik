import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const isArabic = i18n.language.startsWith('ar');

  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(isArabic ? 'en' : 'ar')}
      className="px-2 h-10 text-sm font-semibold hover:text-[var(--color-gold)] transition-colors"
      aria-label={t('common.language')}
    >
      {isArabic ? 'English' : 'العربية'}
    </button>
  );
}