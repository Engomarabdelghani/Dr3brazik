import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook } from 'react-icons/fi';
import { FaTiktok } from 'react-icons/fa';
import { NAV_LINKS, SITE_NAME } from '../../data/constants';

export default function Footer() {
  return (
    <footer className="mt-32 border-t" style={{ borderColor: 'rgba(255,255,255,0.18)', backgroundColor: '#6d4a37' }}>
      <div className="container-luxe py-14 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          <div className="md:col-span-1">
            <h3 className="text-3xl md:text-[2.2rem] font-extrabold text-white mb-5 leading-none">{SITE_NAME}</h3>
            <p className="text-[15px] leading-relaxed text-[#f2e8e2] max-w-md" style={{ opacity: 0.9 }}>
              Luxury cosmetics crafted with precision and care — bringing high-end skincare, makeup and fragrance to your everyday ritual.
            </p>
          </div>

          <div className="flex justify-start md:justify-center">
            <div>
              <h4 className="text-white font-semibold mb-5 text-lg">Quick Links</h4>
              <ul className="space-y-3.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-[15px] text-[#f2e8e2] hover:text-[var(--color-gold)] transition-colors" style={{ opacity: 0.9 }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-start md:justify-center">
            <div>
              <h4 className="text-white font-semibold mb-5 text-lg">Follow Us</h4>
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
                    className="w-11 h-11 rounded-full flex items-center justify-center border border-white/20 text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
              <p className="text-[14px] text-[#f2e8e2]" style={{ opacity: 0.9 }}>
                We accept instapay, vodafone cash &amp; Cash on Delivery
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[14px] text-[#f2e8e2]" style={{ opacity: 0.8 }}>
            © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>

          <div className="flex items-center gap-2 text-[14px] text-[#f2e8e2]" style={{ opacity: 0.9 }}>
            <span>Crafted with ❤️ by</span>

            <a
              href="https://engomarportfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold tracking-wide text-[#f3d7af] hover:text-white transition-all duration-300"
            >
              Omar Abdelghani
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

