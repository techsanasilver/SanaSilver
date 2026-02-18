import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";

const CarouselContext = React.createContext(null);

function useCarousel() {
    const context = React.useContext(CarouselContext);

    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />");
    }

    return context;
}

const Carousel = React.forwardRef(
    (
        {
            orientation = "horizontal",
            opts,
            setApi,
            plugins,
            className,
            children,
            ...props
        },
        ref,
    ) => {
        const [carouselRef, api] = useEmblaCarousel(
            {
                ...opts,
                axis: orientation === "horizontal" ? "x" : "y",
            },
            plugins,
        );
        const [canScrollPrev, setCanScrollPrev] = React.useState(false);
        const [canScrollNext, setCanScrollNext] = React.useState(false);

        const onSelect = React.useCallback((api) => {
            if (!api) {
                return;
            }

            setCanScrollPrev(api.canScrollPrev());
            setCanScrollNext(api.canScrollNext());
        }, []);

        const scrollPrev = React.useCallback(() => {
            api?.scrollPrev();
        }, [api]);

        const scrollNext = React.useCallback(() => {
            api?.scrollNext();
        }, [api]);

        const handleKeyDown = React.useCallback(
            (event) => {
                if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    scrollPrev();
                } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    scrollNext();
                }
            },
            [scrollPrev, scrollNext],
        );

        React.useEffect(() => {
            if (!api || !setApi) {
                return;
            }

            setApi(api);
        }, [api, setApi]);

        React.useEffect(() => {
            if (!api) {
                return;
            }

            onSelect(api);
            api.on("reInit", onSelect);
            api.on("select", onSelect);

            return () => {
                api?.off("select", onSelect);
            };
        }, [api, onSelect]);

        return (
            <CarouselContext.Provider
                value={{
                    carouselRef,
                    api: api,
                    opts,
                    orientation:
                        orientation ||
                        (opts?.axis === "y" ? "vertical" : "horizontal"),
                    scrollPrev,
                    scrollNext,
                    canScrollPrev,
                    canScrollNext,
                }}
            >
                <div
                    ref={ref}
                    onKeyDownCapture={handleKeyDown}
                    className={className}
                    role="region"
                    aria-roledescription="carousel"
                    {...props}
                >
                    {children}
                </div>
            </CarouselContext.Provider>
        );
    },
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef(({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
        <div ref={carouselRef} className="overflow-hidden">
            <div
                ref={ref}
                className={`flex ${orientation === "horizontal" ? "" : "flex-col"} ${className || ""}`}
                {...props}
            />
        </div>
    );
});
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            role="group"
            aria-roledescription="slide"
            className={`min-w-0 shrink-0 grow-0 ${className || ""}`}
            {...props}
        />
    );
});
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef(
    ({ className, children, ...props }, ref) => {
        const { scrollPrev, canScrollPrev } = useCarousel();

        if (!canScrollPrev) return null;

        return (
            <button
                ref={ref}
                className={className}
                onClick={scrollPrev}
                {...props}
            >
                {children}
                <span className="sr-only">Previous slide</span>
            </button>
        );
    },
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef(
    ({ className, children, ...props }, ref) => {
        const { scrollNext, canScrollNext } = useCarousel();

        if (!canScrollNext) return null;

        return (
            <button
                ref={ref}
                className={className}
                onClick={scrollNext}
                {...props}
            >
                {children}
                <span className="sr-only">Next slide</span>
            </button>
        );
    },
);
CarouselNext.displayName = "CarouselNext";

export {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
};
