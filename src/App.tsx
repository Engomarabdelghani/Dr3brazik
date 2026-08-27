import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetails from './pages/ProductDetails';
import Offers from './pages/Offers';
import OfferCollection from './pages/OfferCollection';
import About from './pages/About';
import Contact from './pages/Contact';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import ProtectedRoute from './admin/ProtectedRoute';
import AdminDashboard from './admin/pages/Dashboard';
import ProductsList from './admin/pages/products/ProductsList';
import ProductForm from './admin/pages/products/ProductForm';
import AdminCategories from './admin/pages/Categories';
import AdminOffers from './admin/pages/Offers';
import OfferForm from './admin/pages/OfferForm';
import AdminPromoBanners from './admin/pages/PromoBanners';
import AdminShippingZones from './admin/pages/ShippingZones';
import AdminSocialPosts from './admin/pages/SocialPosts';
import AdminTestimonials from './admin/pages/Testimonials';
import AdminCoupons from './admin/pages/Coupons';

export default function App() {
  return (
    <AdminAuthProvider>
      <CartProvider>
        <WishlistProvider>
          <RecentlyViewedProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:slug" element={<ProductDetails />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/offer/:id" element={<OfferCollection />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<ProductsList />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id/edit" element={<ProductForm />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="offers" element={<AdminOffers />} />
                  <Route path="offers/new" element={<OfferForm />} />
                  <Route path="offers/:id/edit" element={<OfferForm />} />
                  <Route path="promo-banners" element={<AdminPromoBanners />} />
                  <Route path="shipping-zones" element={<AdminShippingZones />} />
                  <Route path="social-posts" element={<AdminSocialPosts />} />
                  <Route path="testimonials" element={<AdminTestimonials />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </RecentlyViewedProvider>
        </WishlistProvider>
      </CartProvider>
    </AdminAuthProvider>
  );
}
