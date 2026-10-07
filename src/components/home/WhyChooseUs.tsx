import { FiFeather, FiShield, FiTruck, FiHeart } from 'react-icons/fi';
import SectionHeading from '../common/SectionHeading';
import ScrollReveal from '../common/ScrollReveal';
import { useTranslation } from 'react-i18next';

const features = [
  { icon: FiFeather, title: 'premiumIngredients', desc: 'premiumIngredientsDescription' },
  { icon: FiShield, title: 'crueltyFree', desc: 'crueltyFreeDescription' },
  { icon: FiTruck, title: 'fastDelivery', desc: 'fastDeliveryDescription' },
  { icon: FiHeart, title: 'lovedByThousands', desc: 'lovedByThousandsDescription' },
];

export default function WhyChooseUs() {
  const { t } = useTranslation();
  return (
    <section className="container-luxe py-16 md:py-20">
      <SectionHeading eyebrow={t('home.whyEyebrow')} title={t('home.whyTitle')} align="center" />
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <ScrollReveal key={f.title} delay={i * 0.1}>
            <div className="card-luxe p-8 text-center h-full">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
                <f.icon size={24} style={{ color: 'var(--color-gold)' }} />
              </div>
              <h3 className="font-semibold mb-2">{t(`home.${f.title}`)}</h3>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t(`home.${f.desc}`)}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
