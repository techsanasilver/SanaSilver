/**
 * CartSkeleton Component
 * Loading skeleton for the cart page
 */
const CartSkeleton = () => {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-background-primary">
            <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-10 w-48 bg-background-secondary rounded animate-pulse" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Cart Items Column Skeleton */}
                    <div className="lg:col-span-2 space-y-4">
                        {[...Array(3)].map((_, index) => (
                            <div
                                key={index}
                                className="flex gap-4 p-4 lg:p-6 border border-neutral-200 rounded-sm bg-white"
                            >
                                {/* Image Skeleton */}
                                <div className="w-20 h-24 lg:w-28 lg:h-32 bg-background-secondary rounded-sm animate-pulse" />

                                {/* Content Skeleton */}
                                <div className="flex-1 space-y-3">
                                    {/* Title & Price Row */}
                                    <div className="flex justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 w-3/4 bg-background-secondary rounded animate-pulse" />
                                            <div className="h-4 w-1/2 bg-background-secondary rounded animate-pulse" />
                                            <div className="h-3 w-24 bg-background-secondary rounded animate-pulse" />
                                        </div>
                                        <div className="hidden lg:block space-y-2">
                                            <div className="h-6 w-24 bg-background-secondary rounded animate-pulse" />
                                            <div className="h-4 w-20 bg-background-secondary rounded animate-pulse" />
                                        </div>
                                    </div>

                                    {/* Quantity & Actions Row */}
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="h-10 w-32 bg-background-secondary rounded-sm animate-pulse" />
                                        <div className="flex gap-2">
                                            <div className="h-9 w-9 bg-background-secondary rounded-sm animate-pulse" />
                                            <div className="h-9 w-9 bg-background-secondary rounded-sm animate-pulse" />
                                        </div>
                                    </div>

                                    {/* Mobile Price Skeleton */}
                                    <div className="lg:hidden pt-3 border-t border-neutral-200">
                                        <div className="flex justify-between">
                                            <div className="h-5 w-20 bg-background-secondary rounded animate-pulse" />
                                            <div className="h-6 w-24 bg-background-secondary rounded animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Column Skeleton */}
                    <div className="lg:col-span-1">
                        <div className="border border-neutral-200 rounded-sm bg-white p-6 sticky top-4">
                            {/* Title */}
                            <div className="h-6 w-32 bg-background-secondary rounded animate-pulse mb-6" />

                            {/* Summary Items */}
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between">
                                    <div className="h-5 w-24 bg-background-secondary rounded animate-pulse" />
                                    <div className="h-5 w-20 bg-background-secondary rounded animate-pulse" />
                                </div>
                                <div className="flex justify-between">
                                    <div className="h-5 w-20 bg-background-secondary rounded animate-pulse" />
                                    <div className="h-5 w-16 bg-background-secondary rounded animate-pulse" />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-neutral-200 my-6" />

                            {/* Total */}
                            <div className="flex justify-between mb-6">
                                <div className="h-6 w-24 bg-background-secondary rounded animate-pulse" />
                                <div className="h-7 w-28 bg-background-secondary rounded animate-pulse" />
                            </div>

                            {/* Checkout Button */}
                            <div className="h-12 w-full bg-background-secondary rounded-sm animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartSkeleton;
