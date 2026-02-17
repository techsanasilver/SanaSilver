import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroCarousel from "../components/home/HeroCarousel";
import FeaturedProducts from "../components/home/FeaturedProducts";
import Loader from "../components/common/Loader";
import logger from "../utils/logger.util";

const Home = () => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen">
            {/* Hero Carousel */}
            <HeroCarousel />

            {/* Featured Products Section */}
            <FeaturedProducts />
        </div>
    );
};

export default Home;
