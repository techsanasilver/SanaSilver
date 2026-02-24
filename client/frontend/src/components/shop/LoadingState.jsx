const ProductSkeleton = () => {
    return (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            {/* Image skeleton */}
            <div className="aspect-square animate-pulse bg-background-secondary"></div>

            {/* Content skeleton */}
            <div className="p-4">
                {/* Title skeleton */}
                <div className="h-4 w-3/4 animate-pulse rounded bg-background-secondary"></div>

                {/* Price skeleton */}
                <div className="mt-2 h-6 w-1/2 animate-pulse rounded bg-background-secondary"></div>
            </div>
        </div>
    );
};

const LoadingState = ({ count = 16 }) => {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, index) => (
                <ProductSkeleton key={index} />
            ))}
        </div>
    );
};

export default LoadingState;
