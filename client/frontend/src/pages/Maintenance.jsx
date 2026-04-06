const Maintenance = () => {
    return (
        <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center px-6 text-center">
            {/* Brand */}
            <p className="text-sm tracking-[0.35em] uppercase text-text-secondary mb-8">
                Sana Silver
            </p>

            {/* Heading */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-text-primary mb-4">
                Under Maintenance
            </h1>

            {/* Divider */}
            <div className="w-12 h-px bg-text-primary/30 mb-6" />

            {/* Message */}
            <p className="text-text-secondary text-sm md:text-base max-w-md leading-relaxed">
                We're making some improvements to bring you a better experience.
                We'll be back shortly.
            </p>
        </div>
    );
};

export default Maintenance;
