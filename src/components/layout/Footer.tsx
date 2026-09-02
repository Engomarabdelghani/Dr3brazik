import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import { NAV_LINKS, SITE_NAME } from '../../data/constants';

export default function Footer() {
  return (
    <footer className="mt-32 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-ink)' }}>
      <div className="container-luxe py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-extrabold text-white mb-3">{SITE_NAME}</h3>
            <p className="text-sm text-gray-400 max-w-sm mb-6">
              Luxury cosmetics crafted with precision and care — bringing high-end skincare, makeup and fragrance to your everyday ritual.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">Quick Links</h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-gray-400 hover:text-[var(--color-gold)] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">Follow Us</h4>
            <div className="flex gap-3 mb-6">
              {[
                {
                  icon: FiInstagram,
                  href: 'https://www.instagram.com/dr_3brazik/',
                  label: 'Instagram',
                },
                {
                  icon: FiFacebook,
                  href: 'https://www.facebook.com/profile.php?id=61589185443012',
                  label: 'Facebook',
                },
                {
                  icon: FaTiktok,
                  href: 'https://www.tiktok.com/@dr_3brazik?is_from_webapp=1&sender_device=pc',
                  label: 'TikTok',
                },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-white/15 text-white hover:bg-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500">We accept instapay, vodafone cash &amp; Cash on Delivery</p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Crafted with ❤️ by</span>

            <a
              href="https://engomarportfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold tracking-wide text-[#C9A96E] hover:text-white transition-all duration-300"
            >
              Omar Abdelghani
            </a>

            <span>•</span>

            <Link
              to="/admin/login"
              aria-label="Admin"
              className="hover:text-white transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

