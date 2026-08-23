import { useState } from 'react';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import emailjs from '@emailjs/browser';
import Button from '../components/ui/Button';
import { WHATSAPP_NUMBER } from '../data/constants';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // استبدل القيم دي بالـ Service ID و Template ID والـ Public Key الخاص بصفحة التواصل
      const SERVICE_ID = 'service_m45cstt';
      const TEMPLATE_ID = 'template_sfhx0oi';
      const PUBLIC_KEY = 'JoP02i58JPAUycgB9';

      const templateParams = {
        from_name: form.name,
        from_email: form.email,
        message: form.message,
      };

      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      setSent(true);
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-luxe py-12">
      <span className="eyebrow">Get in Touch</span>
      <h1 className="section-title mt-3 mb-10">Contact Us</h1>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="space-y-5">
          <div className="card-luxe p-6 flex items-start gap-4">
            <FiMapPin size={20} style={{ color: 'var(--color-gold)' }} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Our Studio</p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Benha, Egypt</p>
            </div>
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
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}