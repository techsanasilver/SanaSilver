import jewelleryCollectionImage from "../../assets/jewellery-collection.png";

const Craftsmanship = () => {
    const processSteps = [
        {
            number: "01",
            title: "Vision",
            description:
                "Every piece begins with inspiration, drawn from nature, architecture, and the human spirit.",
        },
        {
            number: "02",
            title: "Design",
            description:
                "Sketches are refined through countless iterations until each line speaks to perfection.",
        },
        {
            number: "03",
            title: "Creation",
            description:
                "Master artisans bring the design to life, forging silver with techniques passed down through generations.",
        },
        {
            number: "04",
            title: "Refinement",
            description:
                "Hours of meticulous polishing and finishing ensure each piece achieves its luminous potential.",
        },
    ];

    return (
        <section className="py-12 md:py-16 lg:py-20 bg-background-secondary">
            <div className="container mx-auto px-4">
                {/* Section Label */}
                <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest text-center mb-4 md:mb-6">
                    THE ART OF MAKING
                </p>

                {/* Main Heading */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-text-primary text-center mb-8 md:mb-12 max-w-4xl mx-auto px-4">
                    Craftsmanship Beyond Compare
                </h2>

                {/* Featured Image */}
                <div className="md:max-w-[80vw] mx-auto mb-8 md:mb-12 lg:mb-16">
                    <img
                        src={jewelleryCollectionImage}
                        alt="Handcrafted jewelry collection"
                        className="w-full lg:max-w-[80%] lg:m-auto h-auto rounded-sm"
                    />
                </div>

                {/* Process Steps Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 md:max-w-[80vw] mx-auto mb-12 md:mb-16">
                    {processSteps.map((step) => (
                        <div
                            key={step.number}
                            className="bg-background-primary p-4 rounded-sm shadow-lg"
                        >
                            {/* Step Number */}
                            <p className="text-2xl md:text-3xl font-light text-text-secondary mb-2 md:mb-3">
                                {step.number}
                            </p>

                            {/* Step Title */}
                            <h3 className="text-base md:text-lg font-medium text-text-secondary mb-1 md:mb-2">
                                {step.title}
                            </h3>

                            {/* Step Description */}
                            <p className="text-xs md:text-sm text-text-secondary font-light leading-relaxed italic">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Quote */}
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-sm md:text-base lg:text-lg text-accent-1 font-semibold italic leading-relaxed">
                        "We don't just create jewellery. We forge heirlooms that
                        carry stories across generations."
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Craftsmanship;
