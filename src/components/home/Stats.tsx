import AnimatedCounter from '../common/AnimatedCounter';
import { useTranslation } from 'react-i18next';

export default function Stats() {
  const { t } = useTranslation();
  return (
    <section className="py-16" style={{ backgroundColor: 'rgba(201,162,39,0.06)' }}>
      <div className="container-luxe grid grid-cols-2 md:grid-cols-4 gap-8">
        <AnimatedCounter to={15000} suffix="+" label={t('home.happyClients')} />
        <AnimatedCounter to={2000} suffix="+" label={t('home.productsCount')} />
        <AnimatedCounter to={100} suffix="+" label={t('home.citiesServed')} />
        <AnimatedCounter to={98} suffix="%" label={t('home.satisfactionRate')} />
      </div>
    </section>
  );
}
