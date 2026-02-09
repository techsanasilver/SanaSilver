# 📦 ORDER & CHECKOUT SYSTEM - COMPLETE IMPLEMENTATION GUIDE

**Version:** 1.0  
**Last Updated:** February 6, 2026  
**Status:** Planning Phase

---

## 📚 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Dependencies & Integration Points](#dependencies--integration-points)
3. [Taxation System Deep Dive](#taxation-system-deep-dive)
4. [Implementation Phases](#implementation-phases)
5. [Data Models & Schemas](#data-models--schemas)
6. [API Specifications](#api-specifications)
7. [Business Rules & Logic](#business-rules--logic)
8. [Edge Cases & Handling](#edge-cases--handling)
9. [Future Considerations](#future-considerations)
10. [Testing Checklist](#testing-checklist)

---

## SYSTEM OVERVIEW

### **What We're Building**

A complete e-commerce order management system for a silver jewelry business with:

- Shopping cart to checkout flow
- Multiple payment methods (Razorpay, COD)
- Dynamic pricing based on metal rates
- GST calculation and compliance
- Coupon/discount system
- Order tracking
- Invoice generation
- Returns & cancellations (future)

### **Key Characteristics**

- **Dynamic Pricing:** Silver prices fluctuate - need real-time calculation
- **Price Snapshot:** Must freeze prices at order creation (legal requirement)
- **High-Value Items:** Jewelry orders (₹1,000 - ₹100,000+)
- **GST Compliance:** Need accurate tax calculation and invoices
- **Stock Management:** Limited inventory, prevent overselling

---

## DEPENDENCIES & INTEGRATION POINTS

### **1. Internal Dependencies**

```
User Management (Auth) ✅ DONE
    ↓
Cart System ✅ DONE
    ↓
Product & Variants ✅ DONE
    ↓
Address Management ✅ DONE (in User model)
    ↓
┌─────────────────────────────────┐
│   ORDER & CHECKOUT SYSTEM       │ ← We're building this
└─────────────────────────────────┘
    ↓
Payment Gateway Integration (Razorpay)
Email Service (Order confirmations)
SMS Service (Status updates)
Invoice Generation (PDF)
Coupon System (Pricing impact)
```

### **2. External Dependencies**

| Service                  | Purpose                       | Status         | Priority      |
| ------------------------ | ----------------------------- | -------------- | ------------- |
| **Razorpay**             | Payment processing            | Not integrated | HIGH          |
| **SMTP/Email**           | Order confirmations, invoices | Not integrated | HIGH          |
| **SMS Gateway**          | Order status updates          | Not integrated | MEDIUM        |
| **Shiprocket/Delhivery** | Shipping & tracking           | Not integrated | LOW (Phase 2) |
| **PDF Generator**        | Invoice PDFs                  | Not integrated | MEDIUM        |

### **3. Integration Sequence (Recommended)**

```
Phase 1: Core System
├─ Order model & basic APIs
├─ Checkout flow (without payment)
└─ Price calculation logic

Phase 2: Payment Integration
├─ Razorpay setup
├─ Payment verification
└─ COD logic

Phase 3: Notifications
├─ Email setup (Nodemailer)
├─ Order confirmation emails
└─ Status update emails

Phase 4: Advanced Features
├─ Coupon system
├─ SMS integration
├─ Invoice generation
└─ Returns/Cancellations
```

---

## TAXATION SYSTEM DEEP DIVE

### **GST Basics for Jewelry**

- **GST Rate:** 3% (standard for silver jewelry)
- **HSN Code:** 7113 (Articles of precious metal)
- **Tax Type:** CGST + SGST (intrastate) OR IGST (interstate)

---

### **Scenario 1: Normal Taxation (No Coupon)**

**Example Product:**

- Weight: 10 grams
- Silver rate: ₹80/gram
- Making charges: ₹50/gram
- Gemstone charges: ₹200

**Calculation:**

```
Metal Value     = 10 × 80           = ₹800
Making Charges  = 10 × 50           = ₹500
Gemstone        =                     ₹200
                                    -------
Subtotal        =                     ₹1,500
GST @ 3%        = 1500 × 0.03       = ₹45
                                    -------
Total           =                     ₹1,545
```

**Tax Base:** ₹1,500 (full subtotal)

---

### **Scenario 2: Flat Discount Coupon (₹200 off)**

**Discount Application:**

```
Subtotal        =                     ₹1,500
Coupon Discount = -₹200
                                    -------
Discounted Base =                     ₹1,300
GST @ 3%        = 1300 × 0.03       = ₹39
                                    -------
Total           =                     ₹1,339
```

**Tax Base:** ₹1,300 (after discount)

**✅ CORRECT METHOD:** Discount applied BEFORE tax calculation

---

### **Scenario 3: Percentage Discount Coupon (10% off)**

**Discount Application:**

```
Subtotal        =                     ₹1,500
Coupon Discount = 1500 × 0.10       = -₹150
                                    -------
Discounted Base =                     ₹1,350
GST @ 3%        = 1350 × 0.03       = ₹40.50
                                    -------
Total           =                     ₹1,390.50
```

**Tax Base:** ₹1,350 (after discount)

---

### **Scenario 4: Multiple Items with Coupon**

**Cart:**

- Item A: Subtotal ₹1,500
- Item B: Subtotal ₹2,000
- Item C: Subtotal ₹500

**Cart Total:** ₹4,000

**With Coupon (FLAT500):**

```
Cart Subtotal   =                     ₹4,000
Coupon Discount = -₹500
                                    -------
Discounted Base =                     ₹3,500
GST @ 3%        = 3500 × 0.03       = ₹105
                                    -------
Total           =                     ₹3,605
```

**How to split discount across items?**

**Method 1: Proportional Split (RECOMMENDED)**

```
Item A discount = 500 × (1500/4000) = ₹187.50
Item B discount = 500 × (2000/4000) = ₹250.00
Item C discount = 500 × (500/4000)  = ₹62.50

Item A taxable  = 1500 - 187.50     = ₹1,312.50 → GST: ₹39.38
Item B taxable  = 2000 - 250.00     = ₹1,750.00 → GST: ₹52.50
Item C taxable  = 500 - 62.50       = ₹437.50  → GST: ₹13.12

Total GST = ₹105 ✅
```

**Method 2: Equal Split (NOT RECOMMENDED)**

```
Each item gets ₹500/3 = ₹166.67 discount
❌ Problem: Unfair - small items get disproportionate discount
```

---

### **Scenario 5: Max Discount Cap (15% off, max ₹500)**

**Cart Subtotal:** ₹10,000  
**Coupon:** SAVE15 (15% off, max ₹500)

**Calculation:**

```
Calculated Discount = 10000 × 0.15  = ₹1,500
Max Discount        =                 ₹500
Actual Discount     = min(1500, 500)= ₹500
                                    -------
Discounted Base     = 10000 - 500   = ₹9,500
GST @ 3%           = 9500 × 0.03   = ₹285
                                    -------
Total              =                  ₹9,785
```

---

### **Scenario 6: Shipping Charges + Coupon**

**Important:** Shipping charges are AFTER discount, BEFORE tax (usually not taxed separately)

**Example:**

```
Cart Subtotal       =                 ₹2,000
Coupon Discount     = -₹200
Discounted Subtotal =                 ₹1,800
Shipping Charges    = +₹100
                                    -------
Taxable Base        =                 ₹1,900
GST @ 3%           = 1900 × 0.03   = ₹57
                                    -------
Total              =                  ₹1,957
```

**Note:** Some businesses include shipping in tax base, some don't. Check legal requirements.

---

### **Scenario 7: Interstate vs Intrastate (CGST/SGST vs IGST)**

**Same calculation, different split:**

**Intrastate (within same state):**

```
Taxable Base = ₹1,000
CGST @ 1.5% = ₹15
SGST @ 1.5% = ₹15
Total Tax   = ₹30
```

**Interstate (different states):**

```
Taxable Base = ₹1,000
IGST @ 3%   = ₹30
Total Tax   = ₹30
```

**Same amount, different reporting on invoice**

---

### **GST Calculation Flow (Complete)**

```javascript
// Step 1: Calculate item subtotals (without tax)
itemSubtotals = items.map(item => {
  metalValue = item.weight × silverRate;
  makingCharges = item.weight × makingChargesPerGram;
  gemstoneCharges = item.gemstoneCharges || 0;
  return metalValue + makingCharges + gemstoneCharges;
});

// Step 2: Calculate cart subtotal
cartSubtotal = sum(itemSubtotals);

// Step 3: Apply coupon discount
if (coupon) {
  discount = calculateDiscount(coupon, cartSubtotal);
  // Split discount proportionally across items
  itemDiscounts = itemSubtotals.map(subtotal =>
    discount × (subtotal / cartSubtotal)
  );
} else {
  itemDiscounts = [0, 0, 0...];
}

// Step 4: Calculate discounted item subtotals
discountedItemSubtotals = itemSubtotals.map((subtotal, i) =>
  subtotal - itemDiscounts[i]
);

// Step 5: Add shipping charges (if taxable)
taxableBase = sum(discountedItemSubtotals) + shippingCharges;

// Step 6: Calculate GST
gstAmount = taxableBase × 0.03; // 3% for jewelry

// Step 7: Calculate final total
finalTotal = taxableBase + gstAmount;

// Step 8: For invoice (intrastate)
if (buyer.state === seller.state) {
  cgst = gstAmount / 2;
  sgst = gstAmount / 2;
} else {
  igst = gstAmount;
}
```

---

### **Tax Snapshot Requirements**

**What to save in order:**

```javascript
order = {
    items: [
        {
            productName: "Silver Ring",
            quantity: 1,
            weight: 10,

            // Price breakdown (snapshot)
            metalValue: 800,
            makingCharges: 500,
            gemstoneCharges: 200,
            subtotal: 1500,

            // Discount (if any)
            discount: 187.5,
            discountedSubtotal: 1312.5,

            // Tax
            gstRate: 3,
            gstAmount: 39.38,

            // Final
            total: 1351.88,
        },
    ],

    pricing: {
        itemsSubtotal: 4000,
        discount: 500, // Total coupon discount
        discountedSubtotal: 3500,
        shippingCharges: 100,
        taxableAmount: 3600,
        gstAmount: 108,
        finalTotal: 3708,
    },

    couponCode: "FLAT500",

    // For invoice
    taxSplit: {
        cgst: 54, // or
        sgst: 54, // or
        igst: 108, // (one of these)
    },
};
```

---

### **Common Tax Mistakes to Avoid**

❌ **Mistake 1:** Calculating tax on original price, then applying discount

```javascript
// WRONG
subtotal = 1500;
gst = 1500 × 0.03 = 45;
discount = 200;
total = 1500 + 45 - 200 = 1345; // ❌ Incorrect tax
```

✅ **Correct:**

```javascript
subtotal = 1500;
discount = 200;
discountedSubtotal = 1300;
gst = 1300 × 0.03 = 39;
total = 1300 + 39 = 1339; // ✅ Correct
```

---

❌ **Mistake 2:** Not splitting discount proportionally across items

```javascript
// WRONG - Equal split
discount = 500;
item1Discount = 500 / 3 = 166.67;
item2Discount = 500 / 3 = 166.67; // ❌ Unfair
```

✅ **Correct:**

```javascript
// Proportional split
discount = 500;
item1Discount = 500 × (item1Subtotal / cartSubtotal); // ✅ Fair
```

---

❌ **Mistake 3:** Rounding too early

```javascript
// WRONG
item1Tax = Math.round(item1DiscountedSubtotal × 0.03); // ❌ Rounds each item
item2Tax = Math.round(item2DiscountedSubtotal × 0.03);
totalTax = item1Tax + item2Tax; // May not match invoice total
```

✅ **Correct:**

```javascript
// Calculate precisely, round at the end
item1Tax = item1DiscountedSubtotal × 0.03; // Keep precision
item2Tax = item2DiscountedSubtotal × 0.03;
totalTax = Math.round((item1Tax + item2Tax) × 100) / 100; // ✅ Round total
```

---

## IMPLEMENTATION PHASES

### **PHASE 0: Preparation & Setup** ⏱️ 1 day

#### **Setup Razorpay**

- [ ] Create Razorpay account
- [ ] Get API keys (test & live)
- [ ] Add keys to .env
- [ ] Install razorpay npm package
- [ ] Test connection

#### **Setup Email Service**

- [ ] Choose provider (Gmail SMTP, SendGrid, AWS SES)
- [ ] Create email templates folder
- [ ] Install nodemailer
- [ ] Create email utility service
- [ ] Test email sending

#### **Setup Environment Variables**

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=xxx
FROM_EMAIL=noreply@sanasilver.com
FROM_NAME=Sana Silver

# SMS (future)
SMS_API_KEY=xxx
SMS_SENDER_ID=SANASLV

# Shipping
FREE_SHIPPING_THRESHOLD=2000
FLAT_SHIPPING_CHARGE=100
COD_MAX_ORDER_VALUE=50000
```

---

### **PHASE 1: Core Order System** ⏱️ 2-3 days

#### **1.1 Order Model**

- [ ] Copy order.model.js from admin backend
- [ ] Modify for client needs (remove admin-specific fields)
- [ ] Add necessary indexes
- [ ] Add pre-save hooks (order number generation, status history)
- [ ] Test model creation

**Files:**

- `features/orders/order.model.js`

---

#### **1.2 Basic Order Service**

- [ ] `createOrder()` - Create order from checkout data
- [ ] `getOrderById()` - Fetch single order
- [ ] `getUserOrders()` - List user's orders (paginated)
- [ ] `calculateOrderPricing()` - Price calculation logic
- [ ] `validateOrderItems()` - Validate cart items before order

**Files:**

- `features/orders/order.service.js`

---

#### **1.3 Pricing Service**

- [ ] `calculateItemPrice()` - Calculate single item price
- [ ] `calculateCartSubtotal()` - Calculate cart subtotal
- [ ] `applyCouponDiscount()` - Apply discount (stub for now)
- [ ] `splitDiscountAcrossItems()` - Proportional discount split
- [ ] `calculateGST()` - Calculate GST on taxable amount
- [ ] `calculateFinalTotal()` - Complete price calculation

**Files:**

- `features/orders/pricing.service.js` (new)

---

#### **1.4 Stock Management Service**

- [ ] `validateStock()` - Check if items are in stock
- [ ] `reduceStock()` - Reduce stock after order (atomic)
- [ ] `restoreStock()` - Restore stock on cancellation
- [ ] Use MongoDB transactions for atomicity

**Files:**

- `features/orders/stock.service.js` (new)

---

#### **1.5 Basic Order APIs**

- [ ] GET `/api/orders` - List user's orders
- [ ] GET `/api/orders/:orderId` - Get single order
- [ ] Validate order belongs to authenticated user
- [ ] Add pagination support

**Files:**

- `features/orders/order.controller.js`
- `features/orders/order.routes.js`

**Testing:**

- [ ] Create mock order in database
- [ ] Test fetching orders
- [ ] Test pagination
- [ ] Test unauthorized access (order belongs to different user)

---

### **PHASE 2: Checkout Flow** ⏱️ 2-3 days

#### **2.1 Checkout Initiation**

- [ ] POST `/api/checkout/initiate`
- [ ] Fetch user's cart
- [ ] Validate all cart items (active, in stock)
- [ ] Fetch current prices for all items
- [ ] Calculate complete pricing
- [ ] Validate addresses (from user.addresses or custom)
- [ ] Return checkout summary (don't create order yet)

**Request:**

```json
{
    "shippingAddressId": "addr_123",
    "billingAddressId": "same_as_shipping",
    "paymentMethod": "razorpay",
    "couponCode": "FIRST100",
    "customerNote": "Gift wrap please"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [...with current prices and calculations],
    "addresses": {
      "shipping": {...},
      "billing": {...}
    },
    "pricing": {
      "itemsSubtotal": 4500,
      "discount": 100,
      "shippingCharges": 0,
      "taxableAmount": 4400,
      "gst": 132,
      "total": 4532
    },
    "isValid": true,
    "warnings": []
  }
}
```

**Files:**

- `features/checkout/checkout.service.js`
- `features/checkout/checkout.controller.js`
- `features/checkout/checkout.routes.js`

**Testing:**

- [ ] Test with valid cart
- [ ] Test with empty cart (should error)
- [ ] Test with out-of-stock items (should error/warn)
- [ ] Test with invalid address (should error)
- [ ] Test price calculation accuracy

---

#### **2.2 Address Validation**

- [ ] `validateAddress()` - Validate address fields
- [ ] Check pincode format (6 digits)
- [ ] Check phone format (+91xxxxxxxxxx)
- [ ] Check required fields

**Files:**

- `features/checkout/address-validation.js` (new utility)

---

#### **2.3 Shipping Calculation**

- [ ] Flat rate shipping (₹100 or free above ₹2000)
- [ ] Store thresholds in config
- [ ] Calculate based on subtotal (before discount or after?)
    - **Recommendation:** After discount

**Files:**

- `features/checkout/shipping.service.js` (new)

---

### **PHASE 3: Payment Integration** ⏱️ 2-3 days

#### **3.1 Razorpay Integration**

**Install:**

```bash
npm install razorpay
```

**Setup:**

- [ ] Create Razorpay service wrapper
- [ ] Implement `createRazorpayOrder()`
- [ ] Implement `verifyPaymentSignature()`

**Files:**

- `features/payment/razorpay.service.js`

---

#### **3.2 Razorpay Order Creation**

- [ ] POST `/api/payment/create-razorpay-order`
- [ ] Re-validate checkout data
- [ ] Create Razorpay order via API
- [ ] Create order in DB with status "pending"
- [ ] Store razorpayOrderId in order
- [ ] Return Razorpay order details for frontend

**Request:**

```json
{
    "checkoutData": {
        "shippingAddressId": "addr_123",
        "billingAddressId": "same_as_shipping",
        "paymentMethod": "razorpay"
    }
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        "orderId": "order_mongo_id",
        "razorpayOrderId": "order_MnK6xxxxxx",
        "amount": 453200, // in paise
        "currency": "INR",
        "key": "rzp_test_xxxxx"
    }
}
```

**Files:**

- `features/payment/payment.controller.js`
- `features/payment/payment.routes.js`

**Testing:**

- [ ] Test Razorpay order creation
- [ ] Verify order created in Razorpay dashboard
- [ ] Test with different amounts
- [ ] Test error handling (Razorpay API down)

---

#### **3.3 Payment Verification**

- [ ] POST `/api/payment/verify-razorpay-payment`
- [ ] Verify signature using Razorpay secret
- [ ] If valid:
    - Update order payment status to "paid"
    - Update order status to "confirmed"
    - Reduce stock (atomic operation)
    - Clear user's cart
    - Send order confirmation email
- [ ] If invalid:
    - Update payment status to "failed"
    - Log security warning
    - Return error

**Request:**

```json
{
    "razorpayOrderId": "order_MnK6xxxxxx",
    "razorpayPaymentId": "pay_xxxxx",
    "razorpaySignature": "signature_xxxxx"
}
```

**Response (Success):**

```json
{
    "success": true,
    "data": {
        "orderId": "order_mongo_id",
        "orderNumber": "ORD-20260206-0001",
        "status": "confirmed",
        "paymentStatus": "paid"
    }
}
```

**Critical Security:**

```javascript
// Verify signature
const crypto = require("crypto");
const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_SECRET)
    .update(razorpayOrderId + "|" + razorpayPaymentId)
    .digest("hex");

if (expectedSignature !== razorpaySignature) {
    throw new Error("Invalid payment signature");
}
```

**Testing:**

- [ ] Test with valid payment
- [ ] Test with tampered signature (should fail)
- [ ] Test stock reduction
- [ ] Test cart clearing
- [ ] Verify email sent

---

#### **3.4 COD Payment**

- [ ] POST `/api/checkout/place-order-cod`
- [ ] Validate COD allowed:
    - Order value ≤ ₹50,000
    - Pincode serviceable (optional)
    - User hasn't exceeded failed COD limit
- [ ] Create order with payment.method = "cod"
- [ ] Payment status = "pending"
- [ ] Order status = "confirmed"
- [ ] Reduce stock
- [ ] Clear cart
- [ ] Send order confirmation

**Request:**

```json
{
    "checkoutData": {
        "shippingAddressId": "addr_123",
        "billingAddressId": "same_as_shipping",
        "paymentMethod": "cod"
    }
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        "orderId": "order_mongo_id",
        "orderNumber": "ORD-20260206-0001",
        "status": "confirmed",
        "paymentMethod": "cod"
    }
}
```

**COD Validation Logic:**

```javascript
const validateCOD = async (orderTotal, userId, pincode) => {
    // Check max order value
    if (orderTotal > COD_MAX_ORDER_VALUE) {
        throw new Error(
            `COD not available for orders above ₹${COD_MAX_ORDER_VALUE}`,
        );
    }

    // Check user's failed COD history
    const failedCODCount = await Order.countDocuments({
        customer: userId,
        "payment.method": "cod",
        orderStatus: "cancelled",
        "statusHistory.note": /customer.*not.*available/i,
    });

    if (failedCODCount >= 3) {
        throw new Error("COD not available. Please use online payment.");
    }

    // Check pincode serviceable (future)
    // if (!isServiceable(pincode)) {
    //   throw new Error("COD not available for this pincode");
    // }

    return true;
};
```

**Testing:**

- [ ] Test COD order creation
- [ ] Test COD rejection (order > ₹50K)
- [ ] Test COD rejection (failed deliveries)
- [ ] Test stock reduction
- [ ] Test cart clearing

---

### **PHASE 4: Email Notifications** ⏱️ 1-2 days

#### **4.1 Email Service Setup**

**Install:**

```bash
npm install nodemailer
```

**Create Email Utility:**

- [ ] Configure SMTP transport
- [ ] Create `sendEmail()` function
- [ ] Create email templates folder

**Files:**

- `shared/utils/email.util.js`
- `shared/templates/email/` (folder)

---

#### **4.2 Order Confirmation Email**

- [ ] Create HTML template
- [ ] Include:
    - Order number
    - Items list with images
    - Delivery address
    - Payment details
    - Total amount
    - Expected delivery date
    - Track order link
- [ ] Send automatically after order confirmation

**Template:**

```html
<!-- shared/templates/email/order-confirmation.html -->
<!DOCTYPE html>
<html>
    <head>
        <style>
            /* Email styles */
        </style>
    </head>
    <body>
        <h1>Order Confirmed! 🎉</h1>
        <p>Hi {{customerName}},</p>
        <p>Your order <strong>{{orderNumber}}</strong> has been confirmed.</p>

        <h2>Order Details</h2>
        <table>
            {{#each items}}
            <tr>
                <td><img src="{{image}}" width="80" /></td>
                <td>{{productName}}</td>
                <td>₹{{price}}</td>
            </tr>
            {{/each}}
        </table>

        <h3>Total: ₹{{total}}</h3>

        <a href="{{trackingLink}}">Track Your Order</a>
    </body>
</html>
```

**Testing:**

- [ ] Send test email
- [ ] Check all placeholders replaced
- [ ] Check images load
- [ ] Check links work
- [ ] Test in different email clients

---

#### **4.3 Other Email Templates** (Lower Priority)

- [ ] Order shipped email
- [ ] Order delivered email
- [ ] Order cancelled email

---

### **PHASE 5: Coupon System** ⏱️ 2-3 days

#### **5.1 Coupon Model**

```javascript
Coupon {
  code: String (unique, uppercase),
  description: String,
  discountType: "flat" | "percentage",
  discountValue: Number,
  maxDiscount: Number (for percentage type),
  minOrderValue: Number,
  maxUsageCount: Number,
  currentUsageCount: Number,
  perUserLimit: Number,
  validFrom: Date,
  validUntil: Date,
  isActive: Boolean,
  applicableCategories: [ObjectId],
  applicableProducts: [ObjectId],
  excludedProducts: [ObjectId]
}
```

**Files:**

- `features/coupons/coupon.model.js`

---

#### **5.2 Coupon Service**

- [ ] `validateCoupon()` - Check if coupon is valid
    - Is active
    - Not expired
    - Usage limit not exceeded
    - User limit not exceeded
    - Min order value met
    - Applicable to cart items
- [ ] `calculateDiscount()` - Calculate discount amount
    - Flat: direct value
    - Percentage: value × percentage, capped at maxDiscount
- [ ] `applyCoupon()` - Apply coupon to order
    - Increment usage count
    - Store in order
- [ ] `removeCoupon()` - Remove from order (if user changes mind)

**Files:**

- `features/coupons/coupon.service.js`

---

#### **5.3 Coupon APIs**

- [ ] GET `/api/coupons/available` - List available coupons for user
- [ ] POST `/api/coupons/validate` - Validate coupon code
- [ ] POST `/api/coupons/apply` - Apply coupon to cart/checkout

**Files:**

- `features/coupons/coupon.controller.js`
- `features/coupons/coupon.routes.js`

---

#### **5.4 Coupon Validation Logic**

```javascript
const validateCoupon = async (couponCode, userId, cartSubtotal, cartItems) => {
    const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
    });

    if (!coupon) {
        throw new Error("Invalid coupon code");
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
        throw new Error("Coupon has expired");
    }

    // Check usage limits
    if (coupon.currentUsageCount >= coupon.maxUsageCount) {
        throw new Error("Coupon usage limit reached");
    }

    // Check per-user limit
    const userUsageCount = await Order.countDocuments({
        customer: userId,
        couponCode: couponCode,
    });

    if (userUsageCount >= coupon.perUserLimit) {
        throw new Error("You have already used this coupon");
    }

    // Check min order value
    if (cartSubtotal < coupon.minOrderValue) {
        throw new Error(
            `Minimum order value of ₹${coupon.minOrderValue} required`,
        );
    }

    // Check product applicability
    if (coupon.applicableProducts.length > 0) {
        const hasApplicableProduct = cartItems.some((item) =>
            coupon.applicableProducts.includes(item.productId),
        );

        if (!hasApplicableProduct) {
            throw new Error("Coupon not applicable to cart items");
        }
    }

    // Check excluded products
    if (coupon.excludedProducts.length > 0) {
        const hasExcludedProduct = cartItems.some((item) =>
            coupon.excludedProducts.includes(item.productId),
        );

        if (hasExcludedProduct) {
            throw new Error("Coupon not applicable due to excluded items");
        }
    }

    return coupon;
};
```

---

#### **5.5 Discount Calculation with Tax**

```javascript
const calculateDiscountAndTax = (cartSubtotal, coupon, shippingCharges) => {
  let discount = 0;

  if (coupon.discountType === 'flat') {
    discount = coupon.discountValue;
  } else if (coupon.discountType === 'percentage') {
    const calculatedDiscount = cartSubtotal × (coupon.discountValue / 100);
    discount = Math.min(calculatedDiscount, coupon.maxDiscount || Infinity);
  }

  // Discount cannot exceed cart value
  discount = Math.min(discount, cartSubtotal);

  // Calculate taxable amount
  const discountedSubtotal = cartSubtotal - discount;
  const taxableAmount = discountedSubtotal + shippingCharges;

  // Calculate GST
  const gstAmount = taxableAmount × 0.03; // 3% for jewelry

  // Calculate final total
  const finalTotal = taxableAmount + gstAmount;

  return {
    discount,
    discountedSubtotal,
    taxableAmount,
    gstAmount,
    finalTotal
  };
};
```

---

#### **5.6 Proportional Discount Split**

```javascript
const splitDiscountAcrossItems = (items, totalDiscount) => {
  const totalSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return items.map((item, index) => {
    // Calculate proportional discount for this item
    let itemDiscount = totalDiscount × (item.subtotal / totalSubtotal);

    // For last item, adjust for rounding errors
    if (index === items.length - 1) {
      const allocatedDiscount = items
        .slice(0, -1)
        .reduce((sum, i) => sum + i.discount, 0);
      itemDiscount = totalDiscount - allocatedDiscount;
    }

    // Round to 2 decimal places
    itemDiscount = Math.round(itemDiscount * 100) / 100;

    return {
      ...item,
      discount: itemDiscount,
      discountedSubtotal: item.subtotal - itemDiscount
    };
  });
};
```

**Testing:**

- [ ] Test flat discount
- [ ] Test percentage discount
- [ ] Test max discount cap
- [ ] Test min order value validation
- [ ] Test expired coupon
- [ ] Test usage limit
- [ ] Test per-user limit
- [ ] Test applicable products
- [ ] Test proportional split accuracy
- [ ] Test tax calculation with discount

---

### **PHASE 6: Order Management APIs** ⏱️ 1-2 days

#### **6.1 Order Cancellation**

- [ ] POST `/api/orders/:orderId/cancel`
- [ ] Validate cancellation allowed:
    - Order status = "pending" or "confirmed"
    - Not already cancelled
    - Not shipped/delivered
- [ ] Update order status to "cancelled"
- [ ] Restore stock (atomic)
- [ ] Handle payment refund:
    - Razorpay: Initiate refund via API
    - COD: No action needed (not paid yet)
- [ ] Add to status history
- [ ] Send cancellation email

**Request:**

```json
{
    "reason": "Changed my mind"
}
```

**Response:**

```json
{
    "success": true,
    "data": {
        "orderId": "order_id",
        "status": "cancelled",
        "refundStatus": "initiated"
    }
}
```

**Cancellation Logic:**

```javascript
const cancelOrder = async (orderId, userId, reason) => {
    const order = await Order.findOne({
        _id: orderId,
        customer: userId,
    });

    if (!order) {
        throw new Error("Order not found");
    }

    // Check if cancellation allowed
    if (!["pending", "confirmed"].includes(order.orderStatus)) {
        throw new Error("Order cannot be cancelled at this stage");
    }

    // Start transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Update order status
        order.orderStatus = "cancelled";
        order.statusHistory.push({
            status: "cancelled",
            timestamp: new Date(),
            note: `Cancelled by customer. Reason: ${reason}`,
        });
        await order.save({ session });

        // Restore stock
        await restoreStock(order.items, session);

        // Handle refund if paid
        if (order.payment.status === "paid") {
            await initiateRefund(order, session);
        }

        await session.commitTransaction();

        // Send cancellation email
        await sendCancellationEmail(order);

        return order;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
```

**Testing:**

- [ ] Test cancellation (pending order)
- [ ] Test cancellation (confirmed order)
- [ ] Test cancellation rejection (shipped order)
- [ ] Test stock restoration
- [ ] Test refund initiation
- [ ] Test unauthorized cancellation (different user)

---

#### **6.2 Order Tracking**

- [ ] GET `/api/orders/:orderId/track`
- [ ] Return tracking information:
    - Status history
    - Current status
    - Courier details (if shipped)
    - Tracking number
    - Estimated delivery
- [ ] Timeline view of order progress

**Response:**

```json
{
    "success": true,
    "data": {
        "orderNumber": "ORD-20260206-0001",
        "currentStatus": "shipped",
        "statusHistory": [
            {
                "status": "pending",
                "timestamp": "2026-02-06T10:00:00Z",
                "note": "Order received"
            },
            {
                "status": "confirmed",
                "timestamp": "2026-02-06T10:05:00Z",
                "note": "Payment confirmed"
            },
            {
                "status": "processing",
                "timestamp": "2026-02-06T12:00:00Z",
                "note": "Order is being prepared"
            },
            {
                "status": "shipped",
                "timestamp": "2026-02-07T09:00:00Z",
                "note": "Order shipped via Delhivery"
            }
        ],
        "tracking": {
            "courier": "Delhivery",
            "trackingNumber": "DELXXXXXX",
            "trackingUrl": "https://delhivery.com/track/DELXXXXXX",
            "shippedAt": "2026-02-07T09:00:00Z",
            "estimatedDelivery": "2026-02-10T18:00:00Z"
        }
    }
}
```

---

#### **6.3 Invoice Generation** (Future/Optional)

- [ ] GET `/api/orders/:orderId/invoice`
- [ ] Generate PDF invoice
- [ ] Include:
    - Company details (Sana Silver)
    - GSTIN number
    - Customer details
    - Items table with HSN codes
    - Tax breakdown (CGST/SGST or IGST)
    - Payment details
    - Terms & conditions
- [ ] Return downloadable link or PDF buffer

**Tools:**

- Use `pdfkit` or `puppeteer` for PDF generation
- Store generated invoices in cloud storage (optional)

**Files:**

- `features/orders/invoice.service.js`
- `shared/templates/invoice/invoice-template.html` (if using puppeteer)

---

### **PHASE 7: Returns & Refunds** ⏱️ 2-3 days (FUTURE)

#### **7.1 Return Model**

```javascript
Return {
  order: ObjectId(Order),
  customer: ObjectId(User),
  returnNumber: String (auto-generated),
  items: [{
    product: ObjectId,
    variant: ObjectId,
    productName: String,
    quantity: Number,
    reason: String,
    images: [String] // proof photos
  }],
  returnReason: String,
  status: "requested" | "approved" | "rejected" | "picked_up" | "refunded",
  refundAmount: Number,
  refundMethod: "wallet" | "original_payment_method",
  statusHistory: [{
    status: String,
    timestamp: Date,
    note: String,
    updatedBy: ObjectId(Admin)
  }],
  pickupAddress: Address,
  courierDetails: {
    courier: String,
    trackingNumber: String
  }
}
```

---

#### **7.2 Return APIs**

- [ ] POST `/api/orders/:orderId/return` - Request return
- [ ] GET `/api/returns` - List user's returns
- [ ] GET `/api/returns/:returnId` - Single return details
- [ ] POST `/api/returns/:returnId/cancel` - Cancel return request

---

#### **7.3 Return Validation**

- [ ] Order delivered within return window (7/14 days)
- [ ] Items eligible for return
- [ ] Product condition requirements
- [ ] Upload proof photos

---

#### **7.4 Refund Processing**

- [ ] Admin approves return
- [ ] Pickup scheduled
- [ ] Quality check after pickup
- [ ] Process refund:
    - **Option 1:** Wallet credit (instant)
    - **Option 2:** Original payment method (5-7 days)
- [ ] Restore stock

---

## DATA MODELS & SCHEMAS

### **Order Model**

**File:** `features/orders/order.model.js`

```javascript
const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
            required: true,
        },
        // Snapshot data (freeze at order time)
        productName: { type: String, required: true },
        sku: { type: String, required: true },
        image: { type: String },

        // Quantity
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        // Weight (for jewelry)
        weight: { type: Number, min: 0 },

        // Price breakdown (snapshot)
        metalValue: { type: Number, min: 0 },
        makingCharges: { type: Number, min: 0 },
        gemstoneCharges: { type: Number, default: 0, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },

        // Discount (if coupon applied)
        discount: { type: Number, default: 0, min: 0 },
        discountedSubtotal: { type: Number, min: 0 },

        // Tax
        gstRate: { type: Number, min: 0 },
        gstAmount: { type: Number, min: 0 },

        // Final item total
        total: { type: Number, required: true, min: 0 },
    },
    { _id: true },
);

const addressSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: "India" },
    },
    { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
    {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    },
    { _id: true },
);

const orderSchema = new mongoose.Schema(
    {
        // Auto-generated order number
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            // Format: ORD-YYYYMMDD-0001
        },

        // Customer reference
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Order items
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: "Order must have at least one item",
            },
        },

        // Addresses (snapshot)
        shippingAddress: {
            type: addressSchema,
            required: true,
        },
        billingAddress: {
            type: addressSchema,
            required: true,
        },

        // Pricing summary
        pricing: {
            itemsSubtotal: { type: Number, required: true, min: 0 },
            discount: { type: Number, default: 0, min: 0 },
            discountedSubtotal: { type: Number, min: 0 },
            shippingCharges: { type: Number, default: 0, min: 0 },
            taxableAmount: { type: Number, required: true, min: 0 },
            gst: { type: Number, required: true, min: 0 },
            total: { type: Number, required: true, min: 0 },
        },

        // Tax split (for invoice)
        taxSplit: {
            cgst: { type: Number, min: 0 },
            sgst: { type: Number, min: 0 },
            igst: { type: Number, min: 0 },
        },

        // Payment details
        payment: {
            method: {
                type: String,
                enum: ["razorpay", "cod", "wallet"],
                required: true,
            },
            status: {
                type: String,
                enum: ["pending", "paid", "failed", "refunded"],
                default: "pending",
            },
            razorpayOrderId: { type: String },
            razorpayPaymentId: { type: String },
            razorpaySignature: { type: String },
            paidAt: { type: Date },
        },

        // Order status
        orderStatus: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ],
            default: "pending",
        },

        // Status history timeline
        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },

        // Shipping/Tracking
        tracking: {
            courier: { type: String },
            trackingNumber: { type: String },
            shippedAt: { type: Date },
            estimatedDelivery: { type: Date },
            deliveredAt: { type: Date },
        },

        // Coupon info
        couponCode: { type: String },

        // Notes
        notes: { type: String },
        customerNote: { type: String },
    },
    {
        timestamps: true,
    },
);

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ createdAt: -1 });

// Auto-generate order number
orderSchema.pre("save", async function (next) {
    if (!this.orderNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
        const count = await mongoose.model("Order").countDocuments({
            createdAt: { $gte: new Date(date.setHours(0, 0, 0, 0)) },
        });
        this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, "0")}`;
    }
    next();
});

// Add to status history on status change
orderSchema.pre("save", function (next) {
    if (this.isModified("orderStatus")) {
        this.statusHistory.push({
            status: this.orderStatus,
            timestamp: new Date(),
        });
    }
    next();
});
```

---

### **Coupon Model**

**File:** `features/coupons/coupon.model.js`

```javascript
const couponSchema = new mongoose.Schema(
    {
        // Coupon code
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        // Description
        description: {
            type: String,
            required: true,
        },

        // Discount type
        discountType: {
            type: String,
            enum: ["flat", "percentage"],
            required: true,
        },

        // Discount value
        discountValue: {
            type: Number,
            required: true,
            min: 0,
        },

        // Max discount (for percentage type)
        maxDiscount: {
            type: Number,
            min: 0,
        },

        // Min order value required
        minOrderValue: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Usage limits
        maxUsageCount: {
            type: Number,
            required: true,
            min: 0,
        },
        currentUsageCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        perUserLimit: {
            type: Number,
            default: 1,
            min: 0,
        },

        // Validity period
        validFrom: {
            type: Date,
            required: true,
        },
        validUntil: {
            type: Date,
            required: true,
        },

        // Status
        isActive: {
            type: Boolean,
            default: true,
        },

        // Applicability (optional filters)
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],
        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        excludedProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
    },
    {
        timestamps: true,
    },
);

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validUntil: 1 });
```

---

### **Return Model** (Future)

**File:** `features/returns/return.model.js`

```javascript
const returnItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
        variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
        },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        reason: { type: String, required: true },
        images: [{ type: String }], // proof photos
    },
    { _id: true },
);

const returnSchema = new mongoose.Schema(
    {
        // References
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Return number
        returnNumber: {
            type: String,
            required: true,
            unique: true,
            // Format: RET-YYYYMMDD-0001
        },

        // Items being returned
        items: {
            type: [returnItemSchema],
            required: true,
        },

        // Return details
        returnReason: { type: String, required: true },

        // Status
        status: {
            type: String,
            enum: [
                "requested",
                "approved",
                "rejected",
                "picked_up",
                "received",
                "refunded",
            ],
            default: "requested",
        },

        // Refund details
        refundAmount: { type: Number, required: true, min: 0 },
        refundMethod: {
            type: String,
            enum: ["wallet", "original_payment_method", "bank_transfer"],
        },
        refundProcessedAt: { type: Date },

        // Status history
        statusHistory: [
            {
                status: String,
                timestamp: { type: Date, default: Date.now },
                note: String,
                updatedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Admin",
                },
            },
        ],

        // Pickup details
        pickupAddress: {
            name: String,
            phone: String,
            line1: String,
            line2: String,
            city: String,
            state: String,
            pincode: String,
        },

        // Courier details
        courierDetails: {
            courier: String,
            trackingNumber: String,
            pickedUpAt: Date,
        },
    },
    {
        timestamps: true,
    },
);

// Indexes
returnSchema.index({ returnNumber: 1 });
returnSchema.index({ order: 1 });
returnSchema.index({ customer: 1 });
returnSchema.index({ status: 1 });
```

---

## API SPECIFICATIONS

### **Checkout APIs**

#### **POST /api/checkout/initiate**

**Authentication:** Required (authMiddleware)

**Purpose:** Validate cart and calculate complete pricing for checkout

**Request Body:**

```json
{
    "shippingAddressId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "billingAddressId": "same_as_shipping",
    "paymentMethod": "razorpay",
    "couponCode": "FIRST100",
    "customerNote": "Please gift wrap"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Checkout initiated successfully",
  "data": {
    "items": [
      {
        "product": {
          "_id": "...",
          "name": "Silver Ring",
          "images": ["..."]
        },
        "variant": {
          "_id": "...",
          "sku": "SS-RING-001-S7",
          "price": 2999,
          "stockQuantity": 10
        },
        "quantity": 2,
        "metalValue": 1600,
        "makingCharges": 1000,
        "subtotal": 2600,
        "discount": 50,
        "discountedSubtotal": 2550,
        "gstAmount": 76.50,
        "total": 2626.50
      }
    ],
    "addresses": {
      "shipping": {
        "name": "John Doe",
        "phone": "+919876543210",
        "line1": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      },
      "billing": { ...same or different }
    },
    "pricing": {
      "itemsSubtotal": 4000,
      "discount": 100,
      "discountedSubtotal": 3900,
      "shippingCharges": 0,
      "taxableAmount": 3900,
      "gst": 117,
      "total": 4017
    },
    "coupon": {
      "code": "FIRST100",
      "description": "₹100 off on first order",
      "discountApplied": 100
    },
    "isValid": true,
    "warnings": []
  }
}
```

**Response (Error - 400):**

```json
{
    "success": false,
    "message": "Cart validation failed",
    "errors": [
        {
            "product": "Silver Chain",
            "issue": "Out of stock"
        }
    ]
}
```

---

#### **POST /api/checkout/place-order-cod**

**Authentication:** Required (authMiddleware)

**Purpose:** Place order with Cash on Delivery payment method

**Request Body:**

```json
{
    "checkoutData": {
        "shippingAddressId": "...",
        "billingAddressId": "same_as_shipping",
        "paymentMethod": "cod",
        "couponCode": "FIRST100",
        "customerNote": "..."
    }
}
```

**Response (Success - 200):**

```json
{
    "success": true,
    "message": "Order placed successfully",
    "data": {
        "orderId": "65a1b2c3d4e5f6g7h8i9j0k1",
        "orderNumber": "ORD-20260206-0001",
        "status": "confirmed",
        "paymentMethod": "cod",
        "total": 4017
    }
}
```

**Response (Error - 400):**

```json
{
    "success": false,
    "message": "COD not available for orders above ₹50,000"
}
```

---

### **Payment APIs**

#### **POST /api/payment/create-razorpay-order**

**Authentication:** Required (authMiddleware)

**Purpose:** Create Razorpay order for payment processing

**Request Body:**

```json
{
    "checkoutData": {
        "shippingAddressId": "...",
        "billingAddressId": "...",
        "paymentMethod": "razorpay",
        "couponCode": "..."
    }
}
```

**Response (Success - 200):**

```json
{
    "success": true,
    "message": "Payment order created successfully",
    "data": {
        "orderId": "65a1b2c3d4e5f6g7h8i9j0k1",
        "razorpayOrderId": "order_MnK6xxxxxxxx",
        "amount": 401700,
        "currency": "INR",
        "key": "rzp_test_xxxxxxxxx"
    }
}
```

---

#### **POST /api/payment/verify-razorpay-payment**

**Authentication:** Required (authMiddleware)

**Purpose:** Verify Razorpay payment signature and complete order

**Request Body:**

```json
{
    "razorpayOrderId": "order_MnK6xxxxxxxx",
    "razorpayPaymentId": "pay_xxxxxxxxxx",
    "razorpaySignature": "signature_xxxxxx"
}
```

**Response (Success - 200):**

```json
{
    "success": true,
    "message": "Payment verified and order confirmed",
    "data": {
        "orderId": "65a1b2c3d4e5f6g7h8i9j0k1",
        "orderNumber": "ORD-20260206-0001",
        "status": "confirmed",
        "paymentStatus": "paid"
    }
}
```

**Response (Error - 400):**

```json
{
    "success": false,
    "message": "Invalid payment signature"
}
```

---

### **Order APIs**

#### **GET /api/orders**

**Authentication:** Required (authMiddleware)

**Purpose:** Get list of user's orders with pagination

**Query Parameters:**

- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status
- `startDate` (optional) - Filter by date range
- `endDate` (optional) - Filter by date range

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "_id": "...",
      "orderNumber": "ORD-20260206-0001",
      "items": [...],
      "pricing": {
        "total": 4017
      },
      "orderStatus": "shipped",
      "payment": {
        "method": "razorpay",
        "status": "paid"
      },
      "createdAt": "2026-02-06T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalOrders": 48,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

#### **GET /api/orders/:orderId**

**Authentication:** Required (authMiddleware)

**Purpose:** Get single order details

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "_id": "...",
    "orderNumber": "ORD-20260206-0001",
    "customer": {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210"
    },
    "items": [
      {
        "product": { ...full product details },
        "variant": { ...full variant details },
        "quantity": 2,
        "subtotal": 2600,
        "discount": 50,
        "gstAmount": 76.50,
        "total": 2626.50
      }
    ],
    "shippingAddress": { ... },
    "billingAddress": { ... },
    "pricing": {
      "itemsSubtotal": 4000,
      "discount": 100,
      "shippingCharges": 0,
      "taxableAmount": 3900,
      "gst": 117,
      "total": 4017
    },
    "payment": {
      "method": "razorpay",
      "status": "paid",
      "paidAt": "2026-02-06T10:35:00Z"
    },
    "orderStatus": "shipped",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2026-02-06T10:30:00Z"
      },
      {
        "status": "confirmed",
        "timestamp": "2026-02-06T10:35:00Z"
      },
      {
        "status": "processing",
        "timestamp": "2026-02-06T15:00:00Z"
      },
      {
        "status": "shipped",
        "timestamp": "2026-02-07T09:00:00Z"
      }
    ],
    "tracking": {
      "courier": "Delhivery",
      "trackingNumber": "DEL12345678",
      "shippedAt": "2026-02-07T09:00:00Z",
      "estimatedDelivery": "2026-02-10T18:00:00Z"
    },
    "couponCode": "FIRST100",
    "customerNote": "Please gift wrap",
    "createdAt": "2026-02-06T10:30:00Z",
    "updatedAt": "2026-02-07T09:00:00Z"
  }
}
```

---

#### **POST /api/orders/:orderId/cancel**

**Authentication:** Required (authMiddleware)

**Purpose:** Cancel an order

**Request Body:**

```json
{
    "reason": "Changed my mind"
}
```

**Response (Success - 200):**

```json
{
    "success": true,
    "message": "Order cancelled successfully",
    "data": {
        "orderId": "...",
        "orderNumber": "ORD-20260206-0001",
        "status": "cancelled",
        "refundStatus": "initiated",
        "refundAmount": 4017
    }
}
```

**Response (Error - 400):**

```json
{
    "success": false,
    "message": "Order cannot be cancelled at this stage"
}
```

---

#### **GET /api/orders/:orderId/track**

**Authentication:** Required (authMiddleware)

**Purpose:** Get order tracking information

**Response (Success - 200):**

```json
{
    "success": true,
    "message": "Tracking information retrieved successfully",
    "data": {
        "orderNumber": "ORD-20260206-0001",
        "currentStatus": "shipped",
        "statusHistory": [
            {
                "status": "pending",
                "timestamp": "2026-02-06T10:30:00Z",
                "note": "Order received"
            },
            {
                "status": "confirmed",
                "timestamp": "2026-02-06T10:35:00Z",
                "note": "Payment confirmed"
            },
            {
                "status": "processing",
                "timestamp": "2026-02-06T15:00:00Z",
                "note": "Order is being prepared"
            },
            {
                "status": "shipped",
                "timestamp": "2026-02-07T09:00:00Z",
                "note": "Order shipped via Delhivery"
            }
        ],
        "tracking": {
            "courier": "Delhivery",
            "trackingNumber": "DEL12345678",
            "trackingUrl": "https://delhivery.com/track/DEL12345678",
            "shippedAt": "2026-02-07T09:00:00Z",
            "estimatedDelivery": "2026-02-10T18:00:00Z"
        }
    }
}
```

---

#### **GET /api/orders/:orderId/invoice** (Future)

**Authentication:** Required (authMiddleware)

**Purpose:** Download order invoice as PDF

**Response (Success - 200):**

```json
{
    "success": true,
    "message": "Invoice generated successfully",
    "data": {
        "invoiceUrl": "https://cdn.sanasilver.com/invoices/ORD-20260206-0001.pdf",
        "expiresAt": "2026-02-07T10:30:00Z"
    }
}
```

---

### **Coupon APIs**

#### **GET /api/coupons/available**

**Authentication:** Required (authMiddleware)

**Purpose:** Get list of available coupons for user

**Response (Success - 200):**

```json
{
    "success": true,
    "message": "Available coupons retrieved successfully",
    "data": [
        {
            "_id": "...",
            "code": "FIRST100",
            "description": "₹100 off on your first order",
            "discountType": "flat",
            "discountValue": 100,
            "minOrderValue": 2000,
            "validUntil": "2026-12-31T23:59:59Z"
        },
        {
            "_id": "...",
            "code": "SAVE15",
            "description": "15% off, max ₹500",
            "discountType": "percentage",
            "discountValue": 15,
            "maxDiscount": 500,
            "minOrderValue": 3000,
            "validUntil": "2026-03-31T23:59:59Z"
        }
    ]
}
```

---

#### **POST /api/coupons/validate**

**Authentication:** Required (authMiddleware)

**Purpose:** Validate coupon code and calculate discount

**Request Body:**

```json
{
    "couponCode": "FIRST100",
    "cartSubtotal": 4000
}
```

**Response (Success - 200):**

```json
{
    "success": true,
    "message": "Coupon is valid",
    "data": {
        "code": "FIRST100",
        "description": "₹100 off on your first order",
        "discountType": "flat",
        "discountValue": 100,
        "discountApplied": 100,
        "finalAmount": 3900
    }
}
```

**Response (Error - 400):**

```json
{
    "success": false,
    "message": "Coupon has expired"
}
```

---

## BUSINESS RULES & LOGIC

### **Stock Management Rules**

#### **1. When to Reduce Stock**

✅ **REDUCE:** When payment is successful (Razorpay verified)  
✅ **REDUCE:** When COD order is confirmed  
❌ **DON'T REDUCE:** When item is added to cart  
❌ **DON'T REDUCE:** When checkout is initiated

**Why?** Prevents overselling while allowing flexibility in cart

---

#### **2. Stock Reduction Strategy**

```javascript
// Use atomic operation with condition
const reduceStock = async (variantId, quantity, session) => {
    const result = await ProductVariant.findOneAndUpdate(
        {
            _id: variantId,
            stockQuantity: { $gte: quantity }, // Only if enough stock
        },
        {
            $inc: { stockQuantity: -quantity }, // Atomic decrement
        },
        {
            new: true,
            session, // Use transaction
        },
    );

    if (!result) {
        throw new Error("Insufficient stock or product not found");
    }

    return result;
};
```

**Benefits:**

- ✅ Atomic operation (no race conditions)
- ✅ Prevents negative stock
- ✅ Transaction support
- ✅ Fails gracefully if insufficient

---

#### **3. Stock Restoration on Cancellation**

```javascript
const restoreStock = async (orderItems, session) => {
    for (const item of orderItems) {
        await ProductVariant.findByIdAndUpdate(
            item.variant,
            {
                $inc: { stockQuantity: item.quantity }, // Add back
            },
            { session },
        );

        logger.info(`Stock restored: ${item.sku} +${item.quantity}`);
    }
};
```

**When to restore:**

- ✅ Order cancelled by user
- ✅ Payment failed after multiple attempts
- ✅ Fraudulent order detected

---

### **Price Snapshot Rules**

#### **What to Snapshot at Order Creation**

```javascript
// Freeze these values:
{
  // Product info
  productName: product.name,
  sku: variant.sku,
  image: variant.images[0] || product.images[0],

  // Pricing
  metalValue: calculatedMetalValue,
  makingCharges: calculatedMakingCharges,
  gemstoneCharges: variant.gemstoneCharges || 0,
  subtotal: calculatedSubtotal,

  // Discount
  discount: itemDiscount,
  discountedSubtotal: subtotal - itemDiscount,

  // Tax
  gstRate: product.gstRate,
  gstAmount: calculatedGST,

  // Final
  total: finalItemTotal
}
```

**Why Snapshot?**

- ✅ Legal requirement (customer agreed to this price)
- ✅ Protects against price changes
- ✅ Accurate refunds/returns
- ✅ Accurate invoicing
- ✅ Historical data integrity

---

### **COD (Cash on Delivery) Rules**

#### **When COD is Allowed**

```javascript
const isCODAllowed = async (orderTotal, userId, pincode) => {
    // Rule 1: Max order value
    if (orderTotal > 50000) {
        return {
            allowed: false,
            reason: "COD not available for orders above ₹50,000",
        };
    }

    // Rule 2: Failed COD history
    const failedCODOrders = await Order.countDocuments({
        customer: userId,
        "payment.method": "cod",
        orderStatus: "cancelled",
        statusHistory: {
            $elemMatch: {
                note: /customer.*refused.*delivery|customer.*unavailable/i,
            },
        },
    });

    if (failedCODOrders >= 3) {
        return {
            allowed: false,
            reason: "COD not available due to past failed deliveries",
        };
    }

    // Rule 3: Pincode serviceability (future)
    // const serviceable = await checkPincodeServiceability(pincode);
    // if (!serviceable) {
    //   return {
    //     allowed: false,
    //     reason: "COD not available for this pincode"
    //   };
    // }

    return { allowed: true };
};
```

---

### **Cancellation Rules**

#### **When Cancellation is Allowed**

```javascript
const canCancelOrder = (order) => {
    // Allowed statuses
    const cancellableStatuses = ["pending", "confirmed"];

    if (!cancellableStatuses.includes(order.orderStatus)) {
        return {
            allowed: false,
            reason: `Cannot cancel order in '${order.orderStatus}' status`,
        };
    }

    // Check if already cancelled
    if (order.orderStatus === "cancelled") {
        return {
            allowed: false,
            reason: "Order is already cancelled",
        };
    }

    return { allowed: true };
};
```

**Cancellation Matrix:**

| Order Status | Can Cancel?        | Refund?              |
| ------------ | ------------------ | -------------------- |
| pending      | ✅ Yes             | ❌ No (not paid yet) |
| confirmed    | ✅ Yes             | ✅ Yes (if paid)     |
| processing   | ❌ No              | -                    |
| shipped      | ❌ No              | -                    |
| delivered    | ❌ No (use return) | -                    |
| cancelled    | ❌ No              | -                    |

---

### **Shipping Charges Rules**

```javascript
const calculateShippingCharges = (cartSubtotal, afterDiscount = true) => {
    // Free shipping threshold
    const FREE_SHIPPING_THRESHOLD = 2000;
    const FLAT_SHIPPING_CHARGE = 100;

    // Calculate on discounted amount
    const amount = afterDiscount ? cartSubtotal : cartSubtotal;

    if (amount >= FREE_SHIPPING_THRESHOLD) {
        return 0; // Free shipping
    }

    return FLAT_SHIPPING_CHARGE;
};
```

**Configuration:**

- Free shipping above ₹2,000
- Flat ₹100 below ₹2,000
- **Applied after discount** (customer-friendly)

---

### **Order Status Flow**

```
pending → confirmed → processing → shipped → delivered
    ↓
cancelled (only from pending/confirmed)
```

**Status Definitions:**

- **pending:** Order created, awaiting payment
- **confirmed:** Payment received, order confirmed
- **processing:** Order being prepared/packed
- **shipped:** Order dispatched with courier
- **delivered:** Order delivered to customer
- **cancelled:** Order cancelled (by user or admin)

---

### **Payment Flow Rules**

#### **Razorpay Payment:**

```
1. User clicks "Pay Now"
2. Backend creates Razorpay order
3. Backend creates Order with status="pending"
4. Frontend opens Razorpay modal
5. User completes payment
6. Frontend receives payment details
7. Frontend calls verify API
8. Backend verifies signature
9. If valid:
   - Update order status="confirmed"
   - Update payment status="paid"
   - Reduce stock
   - Clear cart
   - Send email
10. If invalid:
   - Update payment status="failed"
   - Log security alert
```

#### **COD Payment:**

```
1. User selects COD
2. Backend validates COD eligibility
3. If eligible:
   - Create Order with status="confirmed"
   - Payment method="cod", status="pending"
   - Reduce stock
   - Clear cart
   - Send email
4. If not eligible:
   - Return error with reason
```

---

### **Coupon Application Rules**

#### **Discount Calculation Priority:**

```javascript
// Order of calculation:
1. Calculate cart subtotal (all items)
2. Validate coupon
3. Calculate discount amount
4. Apply discount to cart
5. Split discount proportionally across items
6. Calculate shipping charges (on discounted amount)
7. Calculate GST (on discounted amount + shipping)
8. Calculate final total
```

#### **Proportional Discount Split:**

```javascript
const splitDiscount = (items, totalDiscount) => {
    const cartSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    return items.map((item, index) => {
        // Proportional discount
        let itemDiscount = (totalDiscount * item.subtotal) / cartSubtotal;

        // Round to 2 decimals
        itemDiscount = Math.round(itemDiscount * 100) / 100;

        // Last item adjustment (fix rounding errors)
        if (index === items.length - 1) {
            const allocatedDiscount = items
                .slice(0, -1)
                .reduce((sum, i) => sum + i.discount, 0);
            itemDiscount = totalDiscount - allocatedDiscount;
        }

        return {
            ...item,
            discount: itemDiscount,
            discountedSubtotal: item.subtotal - itemDiscount,
        };
    });
};
```

---

## EDGE CASES & HANDLING

### **1. Race Conditions**

#### **Problem:** Multiple users trying to buy last item simultaneously

**Solution:** Use MongoDB transactions + atomic operations

```javascript
// Use $inc for atomic stock reduction
await ProductVariant.findOneAndUpdate(
    {
        _id: variantId,
        stockQuantity: { $gte: quantity },
    },
    {
        $inc: { stockQuantity: -quantity },
    },
    { session },
);
```

If stock not available, operation fails automatically.

---

### **2. Payment Succeeds but Order Creation Fails**

**Problem:** Razorpay payment verified, but order save fails (DB error)

**Solution:**

1. Create order BEFORE payment (with status "pending")
2. Update order after payment verification
3. If update fails, log critical error for manual resolution
4. Implement webhook for payment status updates

```javascript
// Idempotent payment verification
const verifyPayment = async (razorpayPaymentId) => {
    // Check if already processed
    const existingOrder = await Order.findOne({
        "payment.razorpayPaymentId": razorpayPaymentId,
    });

    if (existingOrder && existingOrder.payment.status === "paid") {
        // Already processed, return success
        return existingOrder;
    }

    // Continue with verification...
};
```

---

### **3. User Closes Browser During Payment**

**Problem:** User initiates payment, Razorpay modal opens, user closes tab

**Solution:**

1. Order already created with status "pending"
2. Set up Razorpay webhook to receive payment status updates
3. Webhook updates order status even if user not on site
4. Send email with payment status

**Webhook Endpoint:**

```javascript
POST / api / webhooks / razorpay;
// Verify webhook signature
// Update order based on payment status
```

---

### **4. Price Changes During Checkout**

**Problem:** User adds to cart, silver price increases before checkout

**Solution:**
**Option A:** Lock prices for 30 minutes after cart add
**Option B:** Show price change warning, require acceptance
**Option C:** Always use latest price

**Recommendation:** Option B - Show warning

```javascript
const checkPriceChanges = (cartItems, currentPrices) => {
    const changes = [];

    cartItems.forEach((item, index) => {
        const priceDiff = currentPrices[index] - item.priceAtAddTime;
        const changePercent = (priceDiff / item.priceAtAddTime) * 100;

        if (Math.abs(changePercent) > 5) {
            // 5% threshold
            changes.push({
                product: item.productName,
                oldPrice: item.priceAtAddTime,
                newPrice: currentPrices[index],
                change: changePercent,
            });
        }
    });

    return changes;
};
```

Frontend shows modal: "Prices have changed. Do you want to proceed?"

---

### **5. Coupon Abuse**

**Problem:** User creates multiple accounts to use same coupon

**Prevention:**

1. ✅ Limit coupons to one per user (tracked)
2. ✅ Limit coupons to one per phone number
3. ✅ Track device fingerprint (optional)
4. ✅ Manual review for suspicious patterns

---

### **6. Stock Goes Negative**

**Problem:** Bug causes stock to go below 0

**Prevention:**

```javascript
// Mongoose schema validation
stockQuantity: {
  type: Number,
  min: [0, "Stock cannot be negative"],
  validate: {
    validator: function(v) {
      return v >= 0;
    }
  }
}

// Atomic operation with condition
const result = await ProductVariant.findOneAndUpdate(
  {
    _id: variantId,
    stockQuantity: { $gte: quantity }
  },
  {
    $inc: { stockQuantity: -quantity }
  },
  { new: true }
);

if (!result) {
  throw new Error("Insufficient stock");
}
```

---

### **7. Payment Gateway Downtime**

**Problem:** Razorpay API is down

**Solution:**

1. Show error message to user
2. Allow COD as fallback
3. Log error for monitoring
4. Set up status page monitoring

---

### **8. Duplicate Order on Double-Click**

**Problem:** User clicks "Place Order" multiple times

**Prevention:**

1. Disable button after first click (frontend)
2. Check for duplicate in backend:

```javascript
// Check if order exists for this cart in last 5 minutes
const recentOrder = await Order.findOne({
    customer: userId,
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    "items.variant": { $all: cartItemVariantIds },
});

if (recentOrder) {
    throw new Error("Order already placed");
}
```

---

### **9. Refund Failures**

**Problem:** Razorpay refund API fails

**Solution:**

1. Retry with exponential backoff
2. If still fails, create manual refund task
3. Admin dashboard shows pending refunds
4. Manual processing + mark as completed

---

### **10. Address Changed After Order**

**Problem:** User updates/deletes address in profile, but order has reference

**Solution:**
✅ **Snapshot address in order** (don't use reference)

- Order has its own address copy
- Changes to user.addresses don't affect existing orders

---

## FUTURE CONSIDERATIONS

### **1. Wallet System**

**Purpose:** Store credit for refunds, offers, loyalty points

**Model:**

```javascript
// Add to user.model.js
Wallet {
  balance: Number,
  transactions: [{
    type: "credit" | "debit",
    amount: Number,
    source: "refund" | "offer" | "loyalty" | "order",
    reference: ObjectId,
    description: String,
    timestamp: Date
  }]
}
```

**Use Cases:**

- Refunds credited to wallet
- Apply wallet balance at checkout
- Cashback offers
- Loyalty rewards

---

### **2. Gift Cards**

**Model:**

```javascript
GiftCard {
  code: String,
  balance: Number,
  originalAmount: Number,
  isActive: Boolean,
  validUntil: Date,
  purchasedBy: ObjectId(User),
  usedBy: [ObjectId(User)],
  transactions: [{
    order: ObjectId,
    amount: Number,
    timestamp: Date
  }]
}
```

---

### **3. Pre-Orders**

**For out-of-stock items:**

- Allow pre-orders with expected availability date
- Partial payment or full payment
- Notify when available
- Auto-fulfill when stock arrives

---

### **4. Subscriptions**

**For recurring purchases:**

- Monthly jewelry subscription box
- Automatic billing
- Manage subscription (pause, cancel, upgrade)

---

### **5. Multiple Payment Methods in Single Order**

**Example:** ₹5000 via wallet + ₹20000 via Razorpay

**Implementation:**

```javascript
payment: {
    methods: [
        {
            type: "wallet",
            amount: 5000,
            status: "paid",
        },
        {
            type: "razorpay",
            amount: 20000,
            status: "paid",
            razorpayPaymentId: "xxx",
        },
    ];
}
```

---

### **6. Order Modifications**

**Allow users to:**

- Change delivery address (before shipping)
- Add items to order (within 1 hour)
- Remove items (before processing)

**Requires:**

- Complex pricing recalculation
- Partial refunds
- Stock adjustments

---

### **7. Split Orders**

**If items from different warehouses:**

- Split into multiple shipments
- Track separately
- Consolidate invoice

---

### **8. Bulk Orders/Corporate Orders**

**For bulk purchases (>10 items):**

- Custom pricing
- Quote request
- Approval workflow
- Credit terms

---

### **9. Installment/EMI**

**Integration with:**

- Razorpay installments
- ZestMoney
- Simpl

---

### **10. International Orders**

**Considerations:**

- Multi-currency support
- International shipping charges
- Customs duties
- Tax calculation per country
- Currency conversion

---

## TESTING CHECKLIST

### **Unit Tests**

#### **Pricing Service**

- [ ] Calculate item price (metal value + making + GST)
- [ ] Calculate cart subtotal (multiple items)
- [ ] Apply flat discount
- [ ] Apply percentage discount
- [ ] Apply percentage discount with max cap
- [ ] Calculate GST on discounted amount
- [ ] Split discount proportionally across items
- [ ] Handle rounding correctly
- [ ] Calculate shipping charges

#### **Stock Service**

- [ ] Validate stock availability
- [ ] Reduce stock atomically
- [ ] Restore stock on cancellation
- [ ] Handle insufficient stock error

#### **Coupon Service**

- [ ] Validate active coupon
- [ ] Validate expired coupon (should fail)
- [ ] Validate usage limit reached (should fail)
- [ ] Validate per-user limit reached (should fail)
- [ ] Validate min order value (should fail if not met)
- [ ] Calculate flat discount
- [ ] Calculate percentage discount
- [ ] Calculate percentage discount with cap

---

### **Integration Tests**

#### **Checkout Flow**

- [ ] Initiate checkout with valid cart
- [ ] Initiate checkout with empty cart (should fail)
- [ ] Initiate checkout with out-of-stock items (should fail/warn)
- [ ] Initiate checkout with invalid address (should fail)
- [ ] Apply valid coupon
- [ ] Apply invalid coupon (should fail)
- [ ] Calculate complete pricing correctly

#### **Razorpay Payment**

- [ ] Create Razorpay order successfully
- [ ] Verify valid payment signature
- [ ] Reject invalid payment signature
- [ ] Handle duplicate payment verification (idempotent)
- [ ] Reduce stock after payment
- [ ] Clear cart after payment
- [ ] Send confirmation email

#### **COD Payment**

- [ ] Place COD order successfully
- [ ] Reject COD for high-value order
- [ ] Reject COD for user with failed deliveries
- [ ] Reduce stock on COD order
- [ ] Clear cart on COD order

#### **Order Management**

- [ ] Get user's orders (paginated)
- [ ] Get single order details
- [ ] Prevent accessing other user's order
- [ ] Cancel order (pending status)
- [ ] Cancel order (confirmed status)
- [ ] Reject cancellation (shipped status)
- [ ] Restore stock on cancellation
- [ ] Initiate refund on cancellation (paid order)

---

### **End-to-End Tests**

#### **Happy Path - Razorpay**

1. [ ] User adds items to cart
2. [ ] User proceeds to checkout
3. [ ] User enters shipping address
4. [ ] User applies coupon (optional)
5. [ ] User initiates Razorpay payment
6. [ ] Payment successful
7. [ ] Order created with "confirmed" status
8. [ ] Stock reduced
9. [ ] Cart cleared
10. [ ] Email sent

#### **Happy Path - COD**

1. [ ] User adds items to cart
2. [ ] User proceeds to checkout
3. [ ] User selects COD
4. [ ] Order created with "confirmed" status
5. [ ] Stock reduced
6. [ ] Cart cleared
7. [ ] Email sent

#### **Cancellation Flow**

1. [ ] User places order
2. [ ] User cancels order
3. [ ] Order status updated to "cancelled"
4. [ ] Stock restored
5. [ ] Refund initiated (if paid)
6. [ ] Email sent

---

### **Edge Case Tests**

- [ ] Multiple users buying last item (race condition)
- [ ] Payment succeeds but order update fails
- [ ] User closes browser during payment
- [ ] Price changes between cart and checkout
- [ ] Stock goes negative (should prevent)
- [ ] Double-click on place order button
- [ ] Very large order (100+ items)
- [ ] Order with 0 items (should fail)
- [ ] Negative quantity (should fail)
- [ ] Invalid product/variant ID
- [ ] Deleted product in cart
- [ ] Inactive product in cart

---

### **Load Tests**

- [ ] 100 concurrent checkouts
- [ ] 1000 orders per day
- [ ] Payment gateway timeout handling
- [ ] Database connection pool under load

---

### **Security Tests**

- [ ] SQL injection in order notes
- [ ] XSS in customer notes
- [ ] Unauthorized order access
- [ ] Payment signature tampering
- [ ] Coupon code brute-force
- [ ] Stock manipulation attempts

---

## FINAL NOTES

### **Critical Success Factors**

1. ✅ **Price Accuracy** - Tax calculations must be exact
2. ✅ **Stock Integrity** - Never oversell, use atomic operations
3. ✅ **Payment Security** - Always verify Razorpay signatures
4. ✅ **Data Snapshot** - Freeze prices and addresses at order time
5. ✅ **Email Delivery** - Confirmations must be sent reliably
6. ✅ **Error Handling** - Graceful failures with proper rollbacks
7. ✅ **Transaction Atomicity** - Use MongoDB transactions for multi-step operations

---

### **Code Organization**

```
features/
├── orders/
│   ├── order.model.js
│   ├── order.service.js
│   ├── order.controller.js
│   ├── order.routes.js
│   ├── pricing.service.js      (price calculations)
│   ├── stock.service.js        (stock management)
│   └── invoice.service.js      (PDF generation)
├── checkout/
│   ├── checkout.service.js
│   ├── checkout.controller.js
│   ├── checkout.routes.js
│   ├── address-validation.js
│   └── shipping.service.js
├── payment/
│   ├── razorpay.service.js
│   ├── payment.controller.js
│   └── payment.routes.js
├── coupons/
│   ├── coupon.model.js
│   ├── coupon.service.js
│   ├── coupon.controller.js
│   └── coupon.routes.js
└── returns/ (future)
    ├── return.model.js
    ├── return.service.js
    ├── return.controller.js
    └── return.routes.js

shared/
├── utils/
│   ├── email.util.js
│   └── sms.util.js
└── templates/
    └── email/
        ├── order-confirmation.html
        ├── order-shipped.html
        ├── order-cancelled.html
        └── order-delivered.html
```

---

### **Development Timeline**

| Phase                        | Duration | Priority |
| ---------------------------- | -------- | -------- |
| Phase 0: Setup               | 1 day    | HIGH     |
| Phase 1: Core Order System   | 2-3 days | HIGH     |
| Phase 2: Checkout Flow       | 2-3 days | HIGH     |
| Phase 3: Payment Integration | 2-3 days | HIGH     |
| Phase 4: Email Notifications | 1-2 days | HIGH     |
| Phase 5: Coupon System       | 2-3 days | MEDIUM   |
| Phase 6: Order Management    | 1-2 days | MEDIUM   |
| Phase 7: Returns & Refunds   | 2-3 days | LOW      |

**Total: ~15-20 days for full implementation**

---

### **Minimum Viable Product (MVP)**

**For production launch, you MUST have:**

- ✅ Phase 1: Core Order System
- ✅ Phase 2: Checkout Flow
- ✅ Phase 3: Payment Integration
- ✅ Phase 4: Email Notifications

**Can be added later:**

- ⏳ Phase 5: Coupon System (nice to have)
- ⏳ Phase 6: Advanced Order Management
- ⏳ Phase 7: Returns & Refunds

---

### **When to Ask for Help**

❓ **Razorpay Integration** - Complex signature verification
❓ **Email Deliverability** - SPF/DKIM records
❓ **Tax Compliance** - Interstate GST rules
❓ **PDF Generation** - Complex invoice templates
❓ **Load Testing** - Performance optimization

---

### **Reference Links**

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Nodemailer Guide](https://nodemailer.com/)
- [GST India Portal](https://www.gst.gov.in/)
- [MongoDB Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [PDFKit](http://pdfkit.org/)

---

**🎯 START WITH: Phase 0 (Setup) → Phase 1 (Core System) → Phase 2 (Checkout)**

**This document is your roadmap. Follow it step by step. Good luck! 🚀**
