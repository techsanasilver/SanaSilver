const ProductDetailSkeleton = () => {
    return (
        <div className="min-h-screen bg-background-primary">
            <div className="px-4 lg:px-8 xl:px-16 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-8 max-w-[90vw] mx-auto">
                    {/* Image Gallery Skeleton */}
                    <div className="space-y-3">
                        {/* Main Image */}
                        <div className="w-full aspect-square bg-background-secondary rounded-sm animate-pulse" />

                        {/* Thumbnail Gallery */}
                        <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="aspect-square bg-background-secondary rounded-sm animate-pulse"
                                />
                            ))}
                        </div>
                    </div>

                    {/* Product Info Skeleton */}
                    <div className="space-y-5">
                        {/* Title */}
                        <div className="space-y-3">
                            <div className="h-8 bg-background-secondary rounded animate-pulse w-3/4" />

                            {/* Rating */}
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-20 bg-background-secondary rounded animate-pulse" />
                                <div className="h-4 w-24 bg-background-secondary rounded animate-pulse" />
                            </div>

                            {/* Price & Stock */}
                            <div className="flex items-center gap-4">
                                <div className="h-7 w-32 bg-background-secondary rounded animate-pulse" />
                                <div className="h-5 w-20 bg-background-secondary rounded animate-pulse" />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <div className="h-4 bg-background-secondary rounded animate-pulse w-full" />
                            <div className="h-4 bg-background-secondary rounded animate-pulse w-5/6" />
                        </div>

                        {/* Variant Selection */}
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-background-secondary rounded animate-pulse" />
                                <div className="flex gap-2">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-10 w-20 bg-background-secondary rounded-sm animate-pulse"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2">
                            <div className="h-4 w-20 bg-background-secondary rounded animate-pulse" />
                            <div className="h-10 w-32 bg-background-secondary rounded-sm animate-pulse" />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <div className="flex-1 h-12 bg-background-secondary rounded-sm animate-pulse" />
                            <div className="h-12 w-12 bg-background-secondary rounded-sm animate-pulse" />
                        </div>

                        {/* Tabs Skeleton */}
                        <div className="mt-8">
                            <div className="border-b border-divider">
                                <div className="flex gap-6">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="h-4 w-20 bg-background-secondary rounded animate-pulse mb-3"
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="py-6 space-y-2">
                                <div className="h-4 bg-background-secondary rounded animate-pulse w-full" />
                                <div className="h-4 bg-background-secondary rounded animate-pulse w-full" />
                                <div className="h-4 bg-background-secondary rounded animate-pulse w-3/4" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Skeleton - Separate section */}
                <div className="mt-12 max-w-[90vw] mx-auto">
                    <div className="h-8 w-48 bg-background-secondary rounded animate-pulse mb-6" />

                    {/* Rating Summary Skeleton */}
                    <div className="bg-background-secondary rounded-lg p-6 mb-6 animate-pulse">
                        <div className="h-32 bg-gray-300 rounded" />
                    </div>

                    {/* Reviews List Skeleton */}
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="border-b border-divider pb-6 space-y-3"
                            >
                                <div className="h-4 w-40 bg-background-secondary rounded animate-pulse" />
                                <div className="h-3 bg-background-secondary rounded animate-pulse w-full" />
                                <div className="h-3 bg-background-secondary rounded animate-pulse w-4/5" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailSkeleton;
