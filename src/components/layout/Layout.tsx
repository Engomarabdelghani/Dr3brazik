import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import WhatsAppButton from '../common/WhatsAppButton';
import AnnouncementBar, { ANNOUNCEMENT_BAR_HEIGHT } from './AnnouncementBar';
import { fetchCoupons, isCouponActive } from '../../lib/api/coupons';

const NAVBAR_HEIGHT = 80; // px — matches the existing pt-20 the page content was already padded with

export default function Layout() {
  const { pathname } = useLocation();
  const { data: coupons = [] } = useQuery({ queryKey: ['coupons'], queryFn: fetchCoupons, staleTime: 60_000 });
  const announcementCoupon = coupons.find((c) => c.targetType === 'all' && isCouponActive(c));

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
