import { useState } from 'react';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Button from '../components/ui/Button';
import { WHATSAPP_NUMBER } from '../data/constants';
import { useSeo } from '../hooks/useSeo';

const MAP_EMBED_SRC = 'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3438.5508343849483!2d31.182467684874563!3d30.47715798172701!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzDCsDI4JzM3LjgiTiAzMcKwMTAnNDkuMCJF!5e0!3m2!1sar!2seg!4v1788137020314!5m2!1sar!2seg';

export default function Contact() {
  useSeo({ title: 'Contact Us', description: 'Get in touch with Dr. Karam AbdelRazek — WhatsApp, phone, email, and store address.', path: '/contact' });
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="container-luxe py-12">
      <span className="eyebrow">Get in Touch</span>
      <h1 className="section-title mt-3 mb-10">Contact Us</h1>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="space-y-5">
          <div className="card-luxe overflow-hidden">
            <a href="https://maps.app.goo.gl/XnkYTSaz6gL2XhDr5?g_st=ic" target="_blank" rel="noopener noreferrer" className="block">
              <iframe
                src={MAP_EMBED_SRC}
                width="100%"
                height="180"
                style={{ border: 0, display: 'block', pointerEvents: 'none' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Our location on Google Maps"
              />
            </a>
            <a
              href="https://maps.app.goo.gl/XnkYTSaz6gL2XhDr5?g_st=ic"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 flex items-start gap-4 hover:bg-black/[0.02] transition-colors"
            >
              <FiMapPin size={20} style={{ color: 'var(--color-gold)' }} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Our Location</p>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>بنها الفلل شارع مسلم فرع اتصالات  امام كافيه ورد dr 3brazik</p>
              </div>
            </a>
          </div>
          <div className="card-luxe p-6 flex items-start gap-4">
            <FiPhone size={20} style={{ color: 'var(--color-gold)' }} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Phone</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>+201061959922</p>
            </div>
          </div>
          <div className="card-luxe p-6 flex items-start gap-4">
            <FiMail size={20} style={{ color: 'var(--color-gold)' }} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Email</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>3brazikstore99@gmail.com</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: '#25D366' }}
          >
            <FaWhatsapp size={18} /> Chat on WhatsApp
          </a>
        </div>

        <div className="lg:col-span-2 card-luxe p-6 md:p-8">
          {sent ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-bold mb-2">Message Sent</h3>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Thank you for reaching out — we'll get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input required value={form.name} onChange={onChange('name')} placeholder="Your Name" className="input-luxe" />
                <input required type="email" value={form.email} onChange={onChange('email')} placeholder="Your Email" className="input-luxe" />
              </div>
              <textarea required rows={6} value={form.message} onChange={onChange('message')} placeholder="Your Message" className="input-luxe" />
              <Button type="submit" variant="primary">Send Message</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}