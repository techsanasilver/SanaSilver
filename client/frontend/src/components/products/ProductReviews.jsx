import { FaStar } from "react-icons/fa";

const ProductReviews = ({ productId }) => {
    // Mock data - replace with actual API call
    const reviews = [
        {
            id: 1,
            author: "Priya Sharma",
            date: "2 weeks ago",
            rating: 5,
            comment:
                "Absolutely stunning piece! The craftsmanship is excellent and the silver quality is top-notch. Highly recommend!",
        },
        {
            id: 2,
            author: "Rajesh Kumar",
            date: "1 month ago",
            rating: 4,
            comment:
                "Beautiful design and good quality. Delivery was prompt and packaging was secure. Very satisfied with my purchase.",
        },
        {
            id: 3,
            author: "Anjali Patel",
            date: "1 month ago",
            rating: 5,
            comment:
                "This ring exceeded my expectations. The stone setting is perfect and it sparkles beautifully. Will definitely buy again.",
        },
    ];

    const averageRating = 4.9;
    const totalReviews = 203;

    const ratingDistribution = [
        { stars: 5, count: 180, percentage: 89 },
        { stars: 4, count: 15, percentage: 7 },
        { stars: 3, count: 5, percentage: 2 },
        { stars: 2, count: 2, percentage: 1 },
        { stars: 1, count: 1, percentage: 1 },
    ];

    return (
        <div className="space-y-8">
            {/* Rating Summary */}
            <div className="bg-background-secondary rounded-lg p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    {/* Average Rating */}
                    <div className="text-center md:text-left">
                        <div className="text-5xl font-light text-text-primary mb-2">
                            {averageRating}
                        </div>
                        <div className="flex items-center gap-1 justify-center md:justify-start mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                    key={star}
                                    className={`w-4 h-4 ${
                                        star <= Math.floor(averageRating)
                                            ? "text-accent-2"
                                            : "text-gray-300"
                                    }`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-text-secondary">
                            Based on {totalReviews} reviews
                        </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="flex-1 w-full space-y-2">
                        {ratingDistribution.map((item) => (
                            <div
                                key={item.stars}
                                className="flex items-center gap-3"
                            >
                                <span className="text-xs text-text-secondary w-8">
                                    {item.stars}★
                                </span>
                                <div className="flex-1 h-2 bg-divider rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-2"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs text-text-secondary w-10 text-right">
                                    {item.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Write Review Button */}
            <button className="w-full md:w-auto px-8 py-3 border border-divider hover:border-text-primary hover:bg-background-secondary transition-colors rounded-sm text-sm font-medium">
                WRITE A REVIEW
            </button>

            {/* Individual Reviews */}
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="border-b border-divider pb-6 last:border-b-0"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-medium text-text-primary">
                                        {review.author}
                                    </span>
                                    <span className="text-xs text-text-secondary">
                                        {review.date}
                                    </span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <FaStar
                                            key={star}
                                            className={`w-3.5 h-3.5 ${
                                                star <= review.rating
                                                    ? "text-accent-2"
                                                    : "text-gray-300"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            {review.comment}
                        </p>
                    </div>
                ))}
            </div>

            {/* Load More Button */}
            {totalReviews > reviews.length && (
                <button className="w-full md:w-auto px-8 py-3 border border-divider hover:border-text-primary hover:bg-background-secondary transition-colors rounded-sm text-sm font-medium">
                    LOAD MORE REVIEWS
                </button>
            )}
        </div>
    );
};

export default ProductReviews;
