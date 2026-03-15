import craftsmanImage from "../../assets/craftsman.png";

const OurStory = () => {
    return (
        <section className="py-12 md:py-16 lg:py-20 bg-background-secondary">
            <div className="container mx-auto px-4">
                {/* Section Label */}
                <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest text-center mb-4 md:mb-6">
                    OUR STORY
                </p>

                {/* Main Heading */}
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-medium text-text-primary text-center mb-8 md:mb-12 lg:mb-16 max-w-4xl mx-auto px-4">
                    Born from a Vision of Timeless Beauty
                </h2>

                {/* Content Grid: Text + Image */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 max-w-[80vw] mx-auto items-center">
                    {/* Text Content */}
                    <div className="space-y-6 text-text-secondary text-xs md:text-sm lg:text-base leading-relaxed">
                        {/* First paragraph - visible on all screens */}
                        <p>
                            In the heart of an ancient silversmithing tradition,
                            Sana was founded with a singular purpose: to create
                            jewellery that transcends time and trends, pieces
                            that become part of your legacy.
                        </p>

                        {/* Image - visible only on mobile/tablet */}
                        <div className="lg:hidden my-8">
                            <img
                                src={craftsmanImage}
                                alt="Master craftsman at work"
                                className="w-full h-auto rounded-xs"
                            />
                        </div>

                        {/* Remaining paragraphs */}
                        <p>
                            Our story is one of patience, precision, and an
                            unwavering commitment to excellence. Every curve,
                            every surface, every detail is considered with the
                            reverence it deserves.
                        </p>

                        <p>
                            Each piece begins as a vision, carefully sketched
                            and refined until it embodies the perfect balance of
                            elegance and meaning. We believe that true luxury
                            lies not in excess, but in the purity of form and
                            the integrity of craft.
                        </p>
                    </div>

                    {/* Image - visible only on desktop */}
                    <div className="hidden lg:block relative">
                        {/* Shadow box */}
                        <div className="absolute -top-2 -right-2 w-full h-full bg-gray-300 rounded-xs"></div>
                        <img
                            src={craftsmanImage}
                            alt="Master craftsman at work"
                            className="w-full h-auto rounded-xs relative"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OurStory;
