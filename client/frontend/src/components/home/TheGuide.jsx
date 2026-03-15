import { Link } from "react-router-dom";
import guideHerImage from "../../assets/guide-for-her.png";
import guideHimImage from "../../assets/guide-for-him.png";
import guideKidsImage from "../../assets/guide-for-kids.png";
import guideCustomizationImage from "../../assets/guide-customization.png";

const guides = [
    {
        id: "for-her",
        label: "For Her",
        overlay: "Timeless silver pieces crafted to celebrate every woman",
        image: guideHerImage,
        link: "/shop?for=her",
    },
    {
        id: "for-him",
        label: "For Him",
        overlay: "Bold designs that speak of strength and refined taste",
        image: guideHimImage,
        link: "/shop?for=him",
    },
    {
        id: "for-kids",
        label: "For Kids",
        overlay: "Delicate, safe & playful jewellery made for little ones",
        image: guideKidsImage,
        link: "/shop?for=kids",
    },
    {
        id: "customization",
        label: "Customization",
        overlay: "Your vision, our craft — bring your dream piece to life",
        image: guideCustomizationImage,
        link: "/customization",
    },
];

const TheGuide = () => {
    return (
        <section className="py-12 md:py-16 lg:py-20 bg-background-primary">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8 md:mb-12">
                    <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest mb-4 md:mb-6 ">
                        DISCOVER
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-medium text-text-primary mb-4">
                        The Guide
                    </h2>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-2xl mx-auto">
                        Find the perfect piece for everyone you cherish
                    </p>
                </div>

                {/* Guide Grid — alternating vertical offset to match design */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 md:max-w-[80vw] mx-auto items-start">
                    {guides.map((guide, index) => (
                        <Link
                            key={guide.id}
                            to={guide.link}
                            className={`group block ${index % 2 !== 0 ? "lg:mt-4" : ""}`}
                        >
                            {/* Image */}
                            <div className="relative aspect-square overflow-hidden rounded-sm">
                                <img
                                    src={guide.image}
                                    alt={guide.label}
                                    className="w-full h-full object-cover transition-transform duration-1500 ease-out group-hover:scale-110"
                                />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end">
                                    <p className="text-text-primary-invert text-sm md:text-base font-light font-display text-center leading-snug px-5 pb-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-1000">
                                        {guide.overlay}
                                    </p>
                                </div>
                            </div>

                            {/* Label */}
                            <p className="mt-2 text-sm md:text-base text-text-primary text-center font-medium font-display tracking-wide">
                                {guide.label}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TheGuide;
