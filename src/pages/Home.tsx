import Hero from '../components/home/Hero';
import BrandsSlider from '../components/home/BrandsSlider';
import PromoBanners from '../components/home/PromoBanners';
import Categories from '../components/home/Categories';
import ProductSection from '../components/home/ProductSection';
import WhyChooseUs from '../components/home/WhyChooseUs';
import Stats from '../components/home/Stats';
import Testimonials from '../components/home/Testimonials';
import InstagramGallery from '../components/home/InstagramGallery';
import { useProducts, getFeatured, getNewArrivals } from '../hooks/useCatalog';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const { data: products = [] } = useProducts();

  return (
    <>
      <PromoBanners />
      <Categories />
      <Hero />
      <BrandsSlider />
      <ProductSection
        eyebrow={t('home.handpicked')}
        title={t('home.featuredProducts')}
        description={t('home.featuredDescription')}
        items={getFeatured(products)}
        viewAllHref="/shop"
      />
      {/* <FlashSale items={getFlashSale(products)} /> */}
      <ProductSection
        eyebrow={t('home.justLanded')}
        title={t('home.newArrivals')}
        description={t('home.newArrivalsDescription')}
        items={getNewArrivals(products)}
        viewAllHref="/shop"
      />
      <WhyChooseUs />
      <Stats />
      <Testimonials />
      <InstagramGallery />
      {/* <NewsletterBanner /> */}
    </>
  );
}
