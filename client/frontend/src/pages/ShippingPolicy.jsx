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

const ShippingPolicy = () => {
    return (
        <div className="bg-background-primary min-h-[calc(100vh-4rem)]">
            {/* Page Header */}
            <div className="bg-background-secondary border-b border-divider py-12 md:py-16">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest mb-4 md:mb-6">
                        POLICIES
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-text-primary mb-4">
                        Shipping & Delivery
                    </h1>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-xl mx-auto">
                        Everything you need to know about how we get your order
                        to you.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12 md:py-16 pb-32">
                <div className="max-w-3xl mx-auto">
                    <Section title="Processing Time">
                        <P>
                            All orders are processed within 1–2 business days
                            (Monday to Friday, excluding public holidays). You
                            will receive an email notification with your
                            tracking details once your order has shipped.
                        </P>
                        <P>
                            Orders containing custom or engraved pieces may
                            require an additional 3–5 business days for
                            preparation. This is clearly noted on the relevant
                            product pages.
                        </P>
                    </Section>

                    <Section title="Domestic Shipping (India)">
                        <P>
                            We ship across India using trusted courier partners
                            including Delhivery, BlueDart, and FedEx.
                        </P>
                        <BulletList
                            items={[
                                "Free standard shipping on all orders above ₹999.",
                                "A flat shipping fee of ₹99 applies to orders below ₹999.",
                                "Standard delivery: 5–7 business days after dispatch.",
                                "Express delivery (where available): 2–3 business days — additional charges apply at checkout.",
                            ]}
                        />
                    </Section>

                    <Section title="International Shipping">
                        <P>
                            We ship worldwide. International shipping costs are
                            calculated at checkout based on the destination
                            country and package weight.
                        </P>
                        <BulletList
                            items={[
                                "Estimated delivery: 10–15 business days after dispatch.",
                                "Tracking is provided for all international shipments.",
                                "Import duties, customs taxes, and other fees charged by the destination country are the sole responsibility of the customer.",
                                "We are not responsible for delays caused by customs clearance.",
                            ]}
                        />
                    </Section>

                    <Section title="Order Tracking">
                        <P>
                            Once your order ships, you will receive a
                            confirmation email containing your tracking number
                            and a direct link to the courier's tracking portal.
                        </P>
                        <P>
                            You can also view your shipment status at any time
                            by visiting{" "}
                            <Link
                                to="/orders"
                                className="text-accent-2 underline underline-offset-2 hover:text-text-primary transition-colors"
                            >
                                My Orders
                            </Link>{" "}
                            in your account.
                        </P>
                    </Section>

                    <Section title="Delivery Attempts & Failed Deliveries">
                        <P>
                            Our courier partners will make up to 3 delivery
                            attempts. If all attempts fail, the package will be
                            held at the local depot for 5 days before being
                            returned to us. In such cases, re-shipping charges
                            will apply.
                        </P>
                        <P>
                            Please ensure your shipping address and contact
                            number are accurate at the time of ordering. We
                            cannot be held liable for failed deliveries due to
                            incorrect address information.
                        </P>
                    </Section>

                    <Section title="Damaged or Lost Parcels">
                        <P>
                            In the rare event that your parcel is lost or
                            arrives damaged, please contact us at{" "}
                            <a
                                href="mailto:support@sanasilver.com"
                                className="text-accent-2 underline underline-offset-2 hover:text-text-primary transition-colors"
                            >
                                support@sanasilver.com
                            </a>{" "}
                            within 48 hours of the delivery date, along with
                            your order number and photos of any damage. We will
                            investigate and arrange a replacement or refund.
                        </P>
                    </Section>

                    {/* Help card */}
                    <div className="mt-12 rounded-sm bg-background-secondary px-6 py-8 text-center">
                        <h3 className="text-xl md:text-2xl font-display font-medium text-text-primary mb-2">
                            Have a shipping enquiry?
                        </h3>
                        <p className="text-sm text-text-secondary font-light mb-6">
                            Our team is happy to help with any questions about
                            your delivery.
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

export default ShippingPolicy;
