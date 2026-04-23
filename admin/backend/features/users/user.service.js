import User from "./user.model.js";
import Order from "../orders/order.model.js";
import Cart from "./cart.model.js";
import Wishlist from "./wishlist.model.js";
import Review from "../reviews/review.model.js";
import logger from "../../shared/utils/logger.util.js";

// ============================================================================
// GET ALL USERS
// ============================================================================

const getAllUsers = async (filters = {}) => {
    const {
        page = 1,
        limit = 20,
        search = null,
        isActive = null,
        sortBy = "newest",
    } = filters;

    const query = {};

    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
        ];
    }

    if (isActive !== null && isActive !== undefined) {
        query.isActive = isActive;
    }

    const sortMap = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        name: { firstName: 1 },
    };
    const sort = sortMap[sortBy] || { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(query)
            .select("-tokenVersion")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query),
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1,
        },
    };
};

// ============================================================================
// GET USER BY ID
// ============================================================================

const getUserById = async (userId) => {
    const user = await User.findById(userId).select("-tokenVersion").lean();

    if (!user) {
        throw new Error("Customer not found");
    }

    // Fetch orders, stats, cart, wishlist, reviews in parallel
    const [orders, orderStats, cart, wishlist, reviews] = await Promise.all([
        Order.find({ customer: userId })
            .select(
                "orderNumber orderStatus pricing.total createdAt payment.status",
            )
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(),
        Order.aggregate([
            { $match: { customer: user._id } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: "$pricing.total" },
                    avgOrderValue: { $avg: "$pricing.total" },
                    deliveredCount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$orderStatus", "delivered"] },
                                1,
                                0,
                            ],
                        },
                    },
                    cancelledCount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$orderStatus", "cancelled"] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]),
        Cart.findOne({ userId })
            .populate("items.productId", "name images")
            .populate("items.variantId", "variantName sellingPrice attributes")
            .lean(),
        Wishlist.findOne({ userId })
            .populate("items.productId", "name images")
            .populate("items.variantId", "variantName sellingPrice attributes")
            .lean(),
        Review.find({ customer: userId })
            .populate("product", "name images")
            .select(
                "rating title body status createdAt product isVerifiedPurchase",
            )
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
    ]);

    return {
        user,
        orders,
        stats: orderStats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            avgOrderValue: 0,
            deliveredCount: 0,
            cancelledCount: 0,
        },
        cart: cart || null,
        wishlist: wishlist || null,
        reviews,
    };
};

// ============================================================================
// TOGGLE USER ACTIVE STATUS
// ============================================================================

const toggleUserStatus = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("Customer not found");
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`User ${userId} status toggled to ${user.isActive}`);

    return { isActive: user.isActive };
};

export { getAllUsers, getUserById, toggleUserStatus };
