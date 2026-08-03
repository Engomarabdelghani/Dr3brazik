import { FiFeather, FiShield, FiTruck, FiHeart } from 'react-icons/fi';
import SectionHeading from '../common/SectionHeading';
import ScrollReveal from '../common/ScrollReveal';

const features = [
  { icon: FiFeather, title: 'Premium Ingredients', desc: 'Rare, dermatologist-approved formulas sourced globally.' },
  { icon: FiShield, title: 'Cruelty-Free', desc: 'Never tested on animals — always kind to your skin and the planet.' },
  { icon: FiTruck, title: 'Fast Delivery', desc: 'Nationwide delivery with careful, elegant packaging.' },
  { icon: FiHeart, title: 'Loved by Thousands', desc: 'Trusted by 15,000+ clients across Egypt and beyond.' },
];

export default function WhyChooseUs() {
  return (
    <section className="container-luxe py-16 md:py-20">
      <SectionHeading eyebrow="Why Dr. Karam" title="Crafted with Purpose" align="center" />
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <ScrollReveal key={f.title} delay={i * 0.1}>
            <div className="card-luxe p-8 text-center h-full">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }}>
                <f.icon size={24} style={{ color: 'var(--color-gold)' }} />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
