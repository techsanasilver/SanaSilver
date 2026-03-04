const WishlistSkeleton = () => {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
            <div className="px-4 lg:px-8 xl:px-16 py-8 lg:py-12">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between mb-8 lg:mb-12">
                    <div className="space-y-2">
                        <div className="h-9 w-48 bg-background-secondary rounded animate-pulse" />
                        <div className="h-5 w-32 bg-background-secondary rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-20 bg-background-secondary rounded animate-pulse" />
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                    {[...Array(10)].map((_, index) => (
                        <div key={index} className="space-y-3">
                            {/* Image Skeleton */}
                            <div className="aspect-3/4 bg-background-secondary rounded-sm animate-pulse" />

                            {/* Product Info Skeleton */}
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-background-secondary rounded animate-pulse" />
                                <div className="h-4 w-3/4 bg-background-secondary rounded animate-pulse" />
                                <div className="h-5 w-24 bg-background-secondary rounded animate-pulse" />
                            </div>

                            {/* Buttons Skeleton */}
                            <div className="flex gap-2">
                                <div className="flex-1 h-10 bg-background-secondary rounded-sm animate-pulse" />
                                <div className="h-10 w-10 bg-background-secondary rounded-sm animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WishlistSkeleton;
