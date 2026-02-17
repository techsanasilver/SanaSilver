import Product from "../products/product.model.js";
import logger from "../../shared/utils/logger.util.js";

/**
 * Get all unique collections with product counts
 * Aggregates from products.collections array
 */
async function getAllCollections() {
    try {
        // Aggregate to get unique collections with counts
        const collections = await Product.aggregate([
            // Only active products
            { $match: { isActive: true } },

            // Unwind collections array (converts array to multiple docs)
            { $unwind: "$collections" },

            // Group by collection name and count
            {
                $group: {
                    _id: "$collections",
                    productCount: { $sum: 1 },
                },
            },

            // Sort by product count (most popular first)
            { $sort: { productCount: -1 } },

            // Reshape output
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    productCount: 1,
                },
            },
        ]);

        logger.info(`Fetched ${collections.length} collections`);

        return { data: collections };
    } catch (error) {
        logger.error("Get collections error:", error.message);
        throw error;
    }
}

/**
 * Get collection details with sample products
 * @param {string} collectionName - Collection name
 * @param {number} limit - Number of sample products to return
 */
async function getCollectionDetails(collectionName, limit = 8) {
    try {
        // Get product count
        const productCount = await Product.countDocuments({
            collections: collectionName,
            isActive: true,
        });

        // Get sample products
        const products = await Product.find({
            collections: collectionName,
            isActive: true,
        })
            .populate("category", "name slug")
            .limit(limit)
            .select("name slug images price isFeatured")
            .lean();

        logger.info(
            `Fetched collection "${collectionName}" with ${products.length} sample products`,
        );

        return {
            data: {
                name: collectionName,
                productCount,
                products,
            },
        };
    } catch (error) {
        logger.error("Get collection details error:", error.message);
        throw error;
    }
}

export { getAllCollections, getCollectionDetails };
