import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import WhatsAppButton from '../common/WhatsAppButton';
import AnnouncementBar, { ANNOUNCEMENT_BAR_HEIGHT } from './AnnouncementBar';
import { fetchCouponAnnouncements } from '../../lib/api/coupons';

const NAVBAR_HEIGHT = 80; // px — matches the existing pt-20 the page content was already padded with

export default function Layout() {
  const { pathname } = useLocation();
  // Only public, active, storewide codes come back from the API (newest first), so the first one is shown.
  const { data: announcements = [] } = useQuery({ queryKey: ['coupons', 'announcements'], queryFn: fetchCouponAnnouncements, staleTime: 60_000 });
  const announcementCoupon = announcements[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {announcementCoupon && <AnnouncementBar coupon={announcementCoupon} />}
      <Navbar topOffset={announcementCoupon ? ANNOUNCEMENT_BAR_HEIGHT : 0} />
      <main className="flex-1" style={{ paddingTop: NAVBAR_HEIGHT + (announcementCoupon ? ANNOUNCEMENT_BAR_HEIGHT : 0) }}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
    </div>
  );
}
