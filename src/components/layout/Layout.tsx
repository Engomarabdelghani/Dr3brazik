import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import WhatsAppButton from '../common/WhatsAppButton';
import AnnouncementBar, { ANNOUNCEMENT_BAR_HEIGHT, useAnnouncements } from './AnnouncementBar';

const NAVBAR_HEIGHT = 80; // px — matches the existing pt-20 the page content was already padded with

export default function Layout() {
  const { pathname } = useLocation();
  const announcements = useAnnouncements();
  const barHeight = announcements.length ? ANNOUNCEMENT_BAR_HEIGHT : 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {announcements.length > 0 && <AnnouncementBar items={announcements} />}
      <Navbar topOffset={barHeight} />
      <main className="flex-1" style={{ paddingTop: NAVBAR_HEIGHT + barHeight }}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}
