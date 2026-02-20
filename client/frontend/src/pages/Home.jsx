import HeroCarousel from "../components/home/HeroCarousel";
import FeaturedProducts from "../components/home/FeaturedProducts";
import JewellerySection from "../components/home/JewellerySection";
import DivineSection from "../components/home/DivineSection";
import HomeDecorSection from "../components/home/HomeDecorSection";
import OurStory from "../components/home/OurStory";
import Craftsmanship from "../components/home/Craftsmanship";
import CuratedCollections from "../components/home/CuratedCollections";
import Commitment from "../components/home/Commitment";

const Home = () => {
    return (
        <div className="min-h-screen">
            {/* Hero Carousel */}
            <HeroCarousel />

            {/* Featured Products Section */}
            <FeaturedProducts />

            <div class="w-full">
                <div class="w-1/5 mx-auto border-b-3 border-divider lg:mt-16"></div>
            </div>

            {/* Our Story Section */}
            <OurStory />

            <div class="w-full">
                <div class="w-1/5 mx-auto border-b-3 border-divider lg:mb-8"></div>
            </div>

            {/* Jewellery Section */}
            <JewellerySection />

            <div class="w-full">
                <div class="w-1/5 mx-auto border-b-3 border-divider lg:mt-12 lg:mb-8"></div>
            </div>

            {/* Divine Section */}
            <DivineSection />

            <div class="w-full">
                <div class="w-1/5 mx-auto border-b-3 border-divider lg:mt-12 lg:mb-8"></div>
            </div>

            {/* Home Decor Section */}
            <HomeDecorSection />

            <div class="w-full">
                <div class="w-1/5 mx-auto border-b-3 border-divider lg:mt-16"></div>
            </div>

            {/* Craftsmanship Section */}
            <Craftsmanship />

            <div class="w-full">
                <div class="w-1/5 mx-auto border-b-3 border-divider lg:mb-8"></div>
            </div>

            {/* Curated Collections Section */}
            <CuratedCollections limitToFour={false} />

            <div class="w-full">
                <div class="w-1/5 mx-auto border-b-3 border-divider lg:mt-16"></div>
            </div>

            {/* Commitment Section */}
            <Commitment />

            <div class="w-full">
                <div class="w-1/5 mx-auto border-b-3 border-divider lg:mb-8"></div>
            </div>
        </div>
    );
};

export default Home;
