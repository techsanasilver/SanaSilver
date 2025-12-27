import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["in", "out", "adjustment", "transfer", "return"],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        reference: {
            type: String,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const inventorySchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product reference is required"],
        },
        variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
        },
        stockQuantity: {
            type: Number,
            required: true,
            default: 0,
            min: [0, "Stock quantity cannot be negative"],
        },
        reservedQuantity: {
            type: Number,
            default: 0,
            min: [0, "Reserved quantity cannot be negative"],
        },
        warehouse: {
            type: String,
            default: "main",
        },
        location: {
            type: String,
        },
        lastRestocked: {
            type: Date,
        },
        movements: {
            type: [stockMovementSchema],
            default: [],
        },
        batchNumber: {
            type: String,
        },
        supplier: {
            type: String,
        },
        purchaseCost: {
            type: Number,
            min: [0, "Purchase cost cannot be negative"],
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
inventorySchema.index({ product: 1, variant: 1, warehouse: 1 });
inventorySchema.index({ warehouse: 1 });
inventorySchema.index({ stockQuantity: 1 });
inventorySchema.index({ batchNumber: 1 });

// Virtual for available quantity
inventorySchema.virtual("availableQuantity").get(function () {
    return this.stockQuantity - this.reservedQuantity;
});

// Pre-save hook to add movement to history
inventorySchema.methods.addMovement = function (
    type,
    quantity,
    reason,
    reference,
    performedBy
) {
    this.movements.push({
        type,
        quantity,
        reason,
        reference,
        performedBy,
        timestamp: new Date(),
    });
};

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;
