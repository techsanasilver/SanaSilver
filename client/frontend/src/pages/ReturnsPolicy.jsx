import { Link } from "react-router-dom";

const Section = ({ title, children }) => (
    <div className="mb-10 md:mb-12">
        <h2 className="text-xl md:text-2xl font-display font-medium text-text-primary mb-3">
            {title}
        </h2>
        <div className="border-t border-divider pt-4 space-y-3">{children}</div>
    </div>
);

const P = ({ children }) => (
    <p className="text-sm md:text-base text-text-secondary font-light leading-relaxed">
        {children}
    </p>
);

const BulletList = ({ items }) => (
    <ul className="space-y-2 pl-4">
        {items.map((item, i) => (
            <li
                key={i}
                className="text-sm md:text-base text-text-secondary font-light leading-relaxed flex gap-2"
            >
                <span className="mt-2 w-1 h-1 rounded-full bg-accent-2 shrink-0" />
                <span>{item}</span>
            </li>
        ))}
    </ul>
);

const ReturnsPolicy = () => {
    return (
        <div className="bg-background-primary min-h-[calc(100vh-4rem)]">
            {/* Page Header */}
            <div className="bg-background-secondary border-b border-divider py-12 md:py-16">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest mb-4 md:mb-6">
                        POLICIES
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-text-primary mb-4">
                        Returns & Exchanges
                    </h1>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-xl mx-auto">
                        We want you to love every piece you receive. Here's how
                        we handle returns and exchanges.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12 md:py-16 pb-32">
                <div className="max-w-3xl mx-auto">
                    <Section title="Return Window">
                        <P>
                            You may initiate a return within{" "}
                            <strong className="font-medium text-text-primary">
                                15 days of delivery
                            </strong>
                            . Returns requested after this period will not be
                            accepted.
                        </P>
                        <P>
                            To be eligible for a return, the item must be
                            unused, in its original condition, and in its
                            original packaging with all tags intact.
                        </P>
                    </Section>

                    <Section title="Non-Returnable Items">
                        <P>
                            The following items cannot be returned under any
                            circumstances:
                        </P>
                        <BulletList
                            items={[
                                "Customised or engraved pieces.",
                                "Earrings (for hygiene reasons), unless they arrive defective or damaged.",
                                "Items that have been worn, altered, or show signs of use.",
                                "Items purchased on clearance or final sale.",
                            ]}
                        />
                    </Section>

                    <Section title="How to Initiate a Return">
                        <P>To start a return, please follow these steps:</P>
                        <BulletList
                            items={[
                                "Email us at support@sanasilver.com with your order number, the item(s) you wish to return, and the reason for the return.",
                                "Our team will review your request and respond within 1–2 business days with return instructions.",
                                "Pack the item securely in its original packaging and ship it to the address provided.",
                                "Once we receive and inspect the item, we will notify you of the approval or rejection of your refund.",
                            ]}
                        />
                        <P>
                            Please do not return items without first contacting
                            us. Unauthorised returns may not be processed.
                        </P>
                    </Section>

                    <Section title="Refunds">
                        <P>
                            Approved refunds are processed within{" "}
                            <strong className="font-medium text-text-primary">
                                7 business days
                            </strong>{" "}
                            of receiving your returned item. The refund will be
                            credited to your original payment method.
                        </P>
                        <BulletList
                            items={[
                                "Credit/Debit card refunds: 5–7 business days to reflect in your account.",
                                "UPI/Net banking refunds: 3–5 business days.",
                                "Cash on Delivery orders: Refunds are issued as store credit or via bank transfer.",
                            ]}
                        />
                        <P>
                            Original shipping charges are non-refundable. Return
                            shipping costs are the customer's responsibility
                            unless the item is defective or incorrect.
                        </P>
                    </Section>

                    <Section title="Exchanges">
                        <P>
                            We offer exchanges for a different size on select
                            pieces within 15 days of delivery. To request an
                            exchange, contact us at support@sanasilver.com with
                            your order number and the size you need.
                        </P>
                        <P>
                            Exchanges are subject to stock availability.
                            Additional charges may apply if the replacement item
                            has a higher value.
                        </P>
                    </Section>

                    <Section title="Damaged or Defective Items">
                        <P>
                            If your order arrives damaged or defective, please
                            email us within{" "}
                            <strong className="font-medium text-text-primary">
                                48 hours of delivery
                            </strong>{" "}
                            with clear photos of the damage and your order
                            number. We will arrange a free replacement or full
                            refund at our discretion.
                        </P>
                    </Section>

                    {/* Help card */}
                    <div className="mt-12 rounded-sm bg-background-secondary px-6 py-8 text-center">
                        <h3 className="text-xl md:text-2xl font-display font-medium text-text-primary mb-2">
                            Need help with a return?
                        </h3>
                        <p className="text-sm text-text-secondary font-light mb-6">
                            Our support team is here to guide you through the
                            process.
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
        </div>
    );
};

export default ReturnsPolicy;
