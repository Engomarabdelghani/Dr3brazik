import Hero from '../components/home/Hero';
import BrandsSlider from '../components/home/BrandsSlider';
import PromoBanners from '../components/home/PromoBanners';
import Categories from '../components/home/Categories';
import ProductSection from '../components/home/ProductSection';
import FlashSale from '../components/home/FlashSale';
import WhyChooseUs from '../components/home/WhyChooseUs';
import Stats from '../components/home/Stats';
import Testimonials from '../components/home/Testimonials';
import InstagramGallery from '../components/home/InstagramGallery';
import NewsletterBanner from '../components/home/NewsletterBanner';
import { useProducts, getFeatured, getNewArrivals, getFlashSale } from '../hooks/useCatalog';

export default function Home() {
  const { data: products = [] } = useProducts();

  return (
    <>
      <PromoBanners />
      <Hero />
      <BrandsSlider />
      <Categories />
      <ProductSection
        eyebrow="Handpicked"
        title="Featured Products"
        description="Our most-loved formulas, chosen for their exceptional results."
        items={getFeatured(products)}
        viewAllHref="/shop"
      />
      <FlashSale items={getFlashSale(products)} />
      <ProductSection
        eyebrow="Just Landed"
        title="New Arrivals"
        description="The latest additions to the Dr. Karam collection."
        items={getNewArrivals(products)}
        viewAllHref="/shop"
      />
      <WhyChooseUs />
      <Stats />
      <Testimonials />
      <InstagramGallery />
      <NewsletterBanner />
    </>
  );
}
