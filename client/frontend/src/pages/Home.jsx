import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroCarousel from "../components/home/HeroCarousel";
import FeaturedProducts from "../components/home/FeaturedProducts";
import JewellerySection from "../components/home/JewellerySection";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";
import DivineSection from "../components/home/DivineSection";
import HomeDecorSection from "../components/home/HomeDecorSection";

const Home = () => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            {/* Hero Carousel */}
            <HeroCarousel />

            {/* Featured Products Section */}
            <FeaturedProducts />

            {/* Jewellery Section */}
            <JewellerySection />

            <div class="w-full">
                <div class="w-1/3 mx-auto border-b-3 border-divider lg:mt-12 lg:mb-8"></div>
            </div>

            {/* Divine Section */}
            <DivineSection />

            <div class="w-full">
                <div class="w-1/3 mx-auto border-b-3 border-divider lg:mt-12 lg:mb-8"></div>
            </div>

            {/* Home Decor Section */}
            <HomeDecorSection />
        </div>
    );
};

export default Home;
