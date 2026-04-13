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

const TermsConditions = () => {
    return (
        <div className="bg-background-primary min-h-[calc(100vh-4rem)]">
            {/* Page Header */}
            <div className="bg-background-secondary border-b border-divider py-12 md:py-16">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest mb-4 md:mb-6">
                        POLICIES
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-text-primary mb-4">
                        Terms & Conditions
                    </h1>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-xl mx-auto">
                        Last updated: March 2026
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12 md:py-16 pb-32">
                <div className="max-w-3xl mx-auto">
                    <Section title="Acceptance of Terms">
                        <P>
                            By accessing and using the Sana Silver website
                            (sanasilver.com), you agree to be bound by these
                            Terms & Conditions. If you do not agree with any
                            part of these terms, you must not use our website.
                        </P>
                        <P>
                            We reserve the right to update these terms at any
                            time. Continued use of the website after changes are
                            published constitutes your acceptance of the revised
                            terms.
                        </P>
                    </Section>

                    <Section title="Use of the Website">
                        <P>
                            You agree to use this website only for lawful
                            purposes and in a manner that does not infringe the
                            rights of others. You must not:
                        </P>
                        <BulletList
                            items={[
                                "Attempt to gain unauthorised access to any part of the website or its servers.",
                                "Transmit any harmful, offensive, or disruptive content.",
                                "Use automated tools to scrape, crawl, or extract data from the website without written permission.",
                                "Impersonate any person or entity or misrepresent your affiliation with any person or entity.",
                            ]}
                        />
                    </Section>

                    <Section title="Account Registration">
                        <P>
                            To place an order, you must create an account and
                            provide accurate, current, and complete information.
                            You are responsible for maintaining the
                            confidentiality of your account credentials and for
                            all activity that occurs under your account.
                        </P>
                        <P>
                            We reserve the right to suspend or terminate
                            accounts that violate these terms or that we
                            reasonably suspect are engaged in fraudulent
                            activity.
                        </P>
                    </Section>

                    <Section title="Orders and Pricing">
                        <P>
                            All orders are subject to availability and
                            confirmation. We reserve the right to cancel or
                            refuse any order at our discretion.
                        </P>
                        <BulletList
                            items={[
                                "Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.",
                                "We reserve the right to change prices at any time without notice. Price changes do not affect orders that have already been confirmed.",
                                "In the event of a pricing error, we will contact you before processing your order.",
                            ]}
                        />
                    </Section>

                    <Section title="Payment">
                        <P>
                            Payment must be made in full at the time of
                            ordering. We accept Cash on Delivery and secure
                            online payments via Razorpay.
                        </P>
                        <P>
                            For online payments, your card or payment
                            information is transmitted securely to Razorpay. We
                            do not store your payment credentials on our
                            servers.
                        </P>
                    </Section>

                    <Section title="Products and Descriptions">
                        <P>
                            We make every effort to display our products as
                            accurately as possible. However, the actual colour
                            and appearance of jewellery may vary slightly from
                            what is shown on screen due to differences in
                            monitor settings.
                        </P>
                        <P>
                            We reserve the right to discontinue any product at
                            any time.
                        </P>
                    </Section>

                    <Section title="Intellectual Property">
                        <P>
                            All content on this website — including text,
                            images, designs, logos, and product photographs — is
                            the intellectual property of Sana Silver and is
                            protected by applicable copyright and trademark
                            laws.
                        </P>
                        <P>
                            You may not reproduce, distribute, or create
                            derivative works from any content on this website
                            without our prior written consent.
                        </P>
                    </Section>

                    <Section title="Limitation of Liability">
                        <P>
                            To the fullest extent permitted by law, Sana Silver
                            shall not be liable for any indirect, incidental,
                            special, or consequential damages arising from your
                            use of the website or purchase of our products,
                            including but not limited to loss of data, revenue,
                            or goodwill.
                        </P>
                        <P>
                            Our total liability to you for any claim arising
                            from these terms shall not exceed the amount you
                            paid for the relevant order.
                        </P>
                    </Section>

                    <Section title="Governing Law">
                        <P>
                            These Terms & Conditions are governed by the laws of
                            India. Any disputes arising from or related to these
                            terms shall be subject to the exclusive jurisdiction
                            of the courts in New Delhi, India.
                        </P>
                    </Section>

                    <Section title="Contact">
                        <P>
                            For any questions regarding these terms, please
                            contact us at{" "}
                            <a
                                href="mailto:support@sanasilver.com"
                                className="text-accent-2 underline underline-offset-2 hover:text-text-primary transition-colors"
                            >
                                support@sanasilver.com
                            </a>
                            .
                        </P>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;
