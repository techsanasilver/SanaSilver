import { LuLeaf, LuSparkles } from "react-icons/lu";
import { GoLightBulb } from "react-icons/go";

const Commitment = () => {
    const commitments = [
        {
            icon: (
                <LuSparkles className="w-8 h-8 text-text-secondary p-1.5 border border-text-secondary-invert rounded-full" />
            ),
            title: "Authenticity",
            description:
                "Every piece is crafted with genuine 925 sterling silver, honoring the metal's pure essence.",
        },
        {
            icon: (
                <LuLeaf className="w-8 h-8 text-text-secondary p-1.5 border border-text-secondary-invert rounded-full" />
            ),
            title: "Sustainability",
            description:
                "We source our materials responsibly, ensuring our craft leaves a positive legacy for future generations.",
        },
        {
            icon: (
                <GoLightBulb className="w-8 h-8 text-text-secondary p-1.5 border border-text-secondary-invert rounded-full" />
            ),
            title: "Innovation",
            description:
                "While rooted in tradition, we continuously explore new techniques to push the boundaries of design.",
        },
    ];

    return (
        <section className="py-12 md:py-16 lg:py-20 bg-background-secondary">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8 md:mb-12">
                    <p className="text-xs md:text-sm uppercase tracking-widest mb-2 text-accent-2 ">
                        OUR COMMITMENT
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-text-primary mb-4">
                        Building a Legacy of Excellence
                    </h2>
                </div>

                {/* Commitment Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 md:max-w-[70vw] mx-auto">
                    {commitments.map((commitment, index) => (
                        <div
                            key={index}
                            className="bg-background-primary rounded-sm px-4 py-6 shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-full border border-text-secondary-invert/50 flex items-center justify-center text-text-muted mb-2">
                                {commitment.icon}
                            </div>

                            {/* Title */}
                            <h3 className="text-base md:text-lg font-medium text-text-primary mb-3">
                                {commitment.title}
                            </h3>

                            {/* Description */}
                            <p className="text-base md:text-lg text-text-secondary leading-relaxed italic font-light">
                                {commitment.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Commitment;
