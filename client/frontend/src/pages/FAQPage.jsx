import { useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";

const faqCategories = [
    {
        category: "ORDERING",
        items: [
            {
                question: "HOW DO I PLACE AN ORDER?",
                answer: "Browse our collection, select your desired piece and size, then add it to your cart. Proceed to checkout, enter your shipping details, and complete payment. You'll receive an order confirmation email immediately.",
            },
            {
                question: "CAN I MODIFY OR CANCEL MY ORDER AFTER PLACING IT?",
                answer: "Orders can be modified or cancelled within 2 hours of placement. After that, your order enters processing and cannot be changed. Please contact our support team as soon as possible at support@sanasilver.com.",
            },
            {
                question: "DO I NEED AN ACCOUNT TO SHOP?",
                answer: "Yes, an account is required to complete a purchase. This allows you to track your orders, save your shipping addresses, and access your order history. Creating an account is quick and free.",
            },
            {
                question: "WHAT PAYMENT METHODS DO YOU ACCEPT?",
                answer: "We accept Cash on Delivery (COD) for domestic orders and secure online payments via Razorpay, which supports all major credit/debit cards, UPI, net banking, and popular wallets.",
            },
        ],
    },
    {
        category: "PRODUCTS",
        items: [
            {
                question: "WHAT MATERIALS DO YOU USE?",
                answer: "All our jewellery is crafted from 925 sterling silver — the highest standard of silver used in fine jewellery. Select pieces are plated with rhodium for extra durability and shine, and we use only ethically sourced gemstones.",
            },
            {
                question: "ARE YOUR PRODUCTS HALLMARKED?",
                answer: "Yes. All our silver jewellery carries a BIS hallmark certifying 925 sterling silver purity. You will find the hallmark stamp on each piece.",
            },
            {
                question: "HOW DO I DETERMINE MY RING SIZE?",
                answer: "You can use our printable ring sizer guide available on the product page, or visit your nearest jeweller for an accurate reading. When in doubt, we recommend sizing up — we also offer one free resize within 30 days of purchase.",
            },
            {
                question: "CAN I GET MY JEWELRY ENGRAVED?",
                answer: "Absolutely. We offer personalised engraving on select pieces. You can add a name, date, or short message during the customisation process. Engraved orders typically take 3–5 additional business days to prepare.",
            },
        ],
    },
    {
        category: "SHIPPING",
        items: [
            {
                question: "HOW LONG DOES DELIVERY TAKE?",
                answer: "Domestic orders are delivered within 5–7 business days. International orders take 10–15 business days. Custom or engraved pieces may require additional time — this is noted on the product page.",
            },
            {
                question: "DO YOU OFFER FREE SHIPPING?",
                answer: "Yes, we offer free standard shipping on all domestic orders above ₹999. Orders below this threshold attract a flat shipping fee of ₹99.",
            },
            {
                question: "HOW CAN I TRACK MY ORDER?",
                answer: "Once your order ships, you will receive an email with a tracking number and a link to the courier's tracking page. You can also view shipment status from your account's order history.",
            },
            {
                question: "DO YOU SHIP INTERNATIONALLY?",
                answer: "Yes, we ship worldwide. Shipping charges and applicable import duties vary by destination and are calculated at checkout. We are not responsible for customs delays or duties levied by the destination country.",
            },
        ],
    },
    {
        category: "RETURNS & CARE",
        items: [
            {
                question: "WHAT IS YOUR RETURN POLICY?",
                answer: "We accept returns within 15 days of delivery for unused, undamaged items in their original packaging. Simply contact our support team to initiate a return. Refunds are processed within 7 business days of receiving the returned item.",
            },
            {
                question: "ARE THERE ANY NON-RETURNABLE ITEMS?",
                answer: "Customised and engraved pieces are non-returnable unless they arrive defective or damaged. Earrings are also non-returnable for hygiene reasons unless faulty.",
            },
            {
                question: "HOW SHOULD I CARE FOR MY SILVER JEWELRY?",
                answer: "Store your silver pieces in an airtight pouch or box to prevent tarnishing. Clean gently with a soft silver polishing cloth. Avoid contact with perfume, lotions, and harsh chemicals, and remove jewellery before swimming or bathing.",
            },
            {
                question: "MY ITEM ARRIVED DAMAGED — WHAT DO I DO?",
                answer: "We're so sorry to hear that. Please email us at support@sanasilver.com within 48 hours of delivery with your order number and photos of the damage. We will arrange a replacement or full refund at no extra cost to you.",
            },
        ],
    },
];

const FAQItem = ({ question, answer, isOpen, onToggle }) => (
    <div className="rounded-sm overflow-hidden">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-5 py-4 text-left bg-background-primary hover:bg-background-secondary transition-colors duration-200"
            aria-expanded={isOpen}
        >
            <span className="text-sm md:text-base font-medium font-display tracking-widest text-text-primary uppercase">
                {question}
            </span>
            <FiChevronDown
                className={`shrink-0 ml-4 w-4 h-4 text-text-secondary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
        </button>
        <div
            className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
            <div className="overflow-hidden">
                <p className="px-5 py-4 text-sm md:text-base text-text-secondary font-light leading-relaxed border-t border-divider bg-background-primary">
                    {answer}
                </p>
            </div>
        </div>
    </div>
);

const FAQPage = () => {
    const [openKey, setOpenKey] = useState(null);

    const handleToggle = (key) => {
        setOpenKey((prev) => (prev === key ? null : key));
    };

    return (
        <div className="bg-background-secondary min-h-[calc(100vh-4rem)]">
            {/* Page Header */}
            <div className="bg-background-primary border-b border-divider py-12 md:py-16">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest mb-4 md:mb-6">
                        HELP CENTRE
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-text-primary mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-xl mx-auto">
                        Find answers to the most common questions about our
                        jewellery, orders, and services.
                    </p>
                </div>
            </div>

            {/* FAQ Content */}
            <div className="container mx-auto px-4 py-12 md:py-16 pb-32">
                <div className="max-w-2xl mx-auto space-y-10 md:space-y-14">
                    {faqCategories.map((cat) => (
                        <div key={cat.category}>
                            {/* Category label */}
                            <p className="text-xs text-accent-2 uppercase tracking-widest mb-5 md:mb-6">
                                {cat.category}
                            </p>
                            <div className="space-y-4">
                                {cat.items.map((item, idx) => {
                                    const key = `${cat.category}-${idx}`;
                                    return (
                                        <FAQItem
                                            key={key}
                                            question={item.question}
                                            answer={item.answer}
                                            isOpen={openKey === key}
                                            onToggle={() => handleToggle(key)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Still have questions */}
                <div className="max-w-2xl mx-auto mt-12 md:mt-16 rounded-sm bg-background-primary px-6 py-8 text-center">
                    <h3 className="text-xl md:text-2xl font-display font-medium text-text-primary mb-2">
                        Still have questions?
                    </h3>
                    <p className="text-sm text-text-secondary font-light mb-6">
                        Our customer service team is available Monday through
                        Friday, 9AM – 6PM IST.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-block px-8 py-2.5 rounded-sm border border-text-primary text-text-primary text-xs md:text-sm tracking-widest font-normal uppercase hover:bg-accent-1 hover:border-accent-1 hover:text-text-primary-invert transition-colors duration-200"
                    >
                        CONTACT US
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
