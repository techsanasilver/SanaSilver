import { useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronDown } from "react-icons/fi";

const faqs = [
    {
        question: "WHAT MATERIALS DO YOU USE?",
        answer: "All our jewellery is crafted from 925 sterling silver — the highest standard of silver used in fine jewellery. Select pieces are plated with rhodium for extra durability and shine, and we use only ethically sourced gemstones.",
    },
    {
        question: "HOW SHOULD I CARE FOR MY SILVER JEWELRY?",
        answer: "Store your silver pieces in an airtight pouch or box to prevent tarnishing. Clean gently with a soft silver polishing cloth and avoid contact with perfume, lotions, and harsh chemicals. Remove jewellery before swimming or bathing.",
    },
    {
        question: "WHAT IS YOUR RETURN POLICY?",
        answer: "We accept returns within 15 days of delivery for unused, undamaged items in original packaging. Customised and engraved pieces are non-returnable. Please contact our support team to initiate a return.",
    },
    {
        question: "DO YOU OFFER INTERNATIONAL SHIPPING?",
        answer: "Yes, we ship worldwide. International orders are delivered within 10–15 business days. Shipping charges and import duties vary by destination and will be calculated at checkout.",
    },
    {
        question: "CAN I GET MY JEWELRY ENGRAVED?",
        answer: "Absolutely. We offer personalised engraving on select pieces. You can add a name, date, or short message during the customisation process. Engraved orders typically take 3–5 additional business days.",
    },
    {
        question: "HOW DO I DETERMINE MY RING SIZE?",
        answer: "You can use our printable ring sizer guide available on the product page, or visit your nearest jeweller for an accurate reading. When in doubt, we recommend sizing up — we also offer one free resize within 30 days of purchase.",
    },
];

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
    return (
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

            {/* Animated answer panel */}
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
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (index) => {
        setOpenIndex((prev) => (prev === index ? null : index));
    };

    return (
        <section className="pt-12 md:pt-16 lg:pt-20 pb-32 bg-background-secondary">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-8 md:mb-12">
                    <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest mb-4 md:mb-6">
                        FAQS
                    </p>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-medium text-text-primary mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-2xl mx-auto">
                        Everything you need to know about our jewelry and
                        services
                    </p>
                </div>

                {/* Accordion */}
                <div className="max-w-2xl mx-auto space-y-6">
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            onToggle={() => handleToggle(index)}
                        />
                    ))}
                </div>

                {/* Still have questions card */}
                <div className="max-w-2xl mx-auto mt-10 md:mt-14 rounded-sm bg-background-primary px-6 py-8 text-center">
                    <h3 className="text-xl md:text-2xl font-display font-medium text-text-primary mb-2">
                        Still have questions?
                    </h3>
                    <p className="text-sm text-text-secondary font-light mb-6">
                        Our customer service team is here to help you Monday
                        through Friday, 9AM – 6PM IST
                    </p>
                    <Link
                        to="/contact"
                        className="inline-block px-8 py-2.5 rounded-sm border border-text-primary text-text-primary text-xs md:text-sm tracking-widest font-normal uppercase hover:bg-accent-1 hover:border-accent-1 hover:text-text-primary-invert transition-colors duration-200"
                    >
                        CONTACT US
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FAQ;
