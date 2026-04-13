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

const PrivacyPolicy = () => {
    return (
        <div className="bg-background-primary min-h-[calc(100vh-4rem)]">
            {/* Page Header */}
            <div className="bg-background-secondary border-b border-divider py-12 md:py-16">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest mb-4 md:mb-6">
                        POLICIES
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-text-primary mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-xl mx-auto">
                        Last updated: March 2026
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-12 md:py-16 pb-32">
                <div className="max-w-3xl mx-auto">
                    <Section title="Introduction">
                        <P>
                            Sana Silver ("we", "our", or "us") is committed to
                            protecting your personal information. This Privacy
                            Policy explains what data we collect, how we use it,
                            and your rights regarding that data when you use our
                            website at sanasilver.com.
                        </P>
                        <P>
                            By using our website, you agree to the collection
                            and use of information in accordance with this
                            policy.
                        </P>
                    </Section>

                    <Section title="Information We Collect">
                        <P>
                            We collect the following categories of personal
                            information:
                        </P>
                        <BulletList
                            items={[
                                "Account information: name, email address, and phone number when you create an account.",
                                "Order information: shipping address, billing details, and order history.",
                                "Payment information: processed securely by Razorpay. We do not store your card or UPI details on our servers.",
                                "Device and usage data: IP address, browser type, pages visited, and referring URLs — collected automatically when you browse our site.",
                                "Communications: emails or messages you send us through our contact form.",
                            ]}
                        />
                    </Section>

                    <Section title="How We Use Your Information">
                        <P>
                            We use the information we collect for the following
                            purposes:
                        </P>
                        <BulletList
                            items={[
                                "To process and fulfil your orders.",
                                "To send order confirmation, shipping updates, and delivery notifications.",
                                "To provide customer support.",
                                "To improve our website and personalise your experience.",
                                "To send occasional marketing emails about new collections and offers — only with your consent.",
                                "To comply with legal obligations.",
                            ]}
                        />
                    </Section>

                    <Section title="Sharing Your Information">
                        <P>
                            We do not sell, trade, or rent your personal
                            information to third parties. We may share your data
                            with:
                        </P>
                        <BulletList
                            items={[
                                "Courier and logistics partners (e.g. Delhivery, BlueDart) solely to fulfil and track your delivery.",
                                "Payment processors (Razorpay) to securely handle transactions.",
                                "Communication service providers (MSG91) to send order-related SMS and email notifications.",
                                "Legal and regulatory authorities if required by law.",
                            ]}
                        />
                    </Section>

                    <Section title="Cookies">
                        <P>
                            We use cookies and similar tracking technologies to
                            enhance your browsing experience, remember your
                            preferences, and analyse site traffic. Cookies are
                            small files stored on your device.
                        </P>
                        <P>
                            You can instruct your browser to refuse all cookies
                            or to alert you when cookies are being sent.
                            However, some parts of the website may not function
                            correctly without cookies.
                        </P>
                    </Section>

                    <Section title="Data Security">
                        <P>
                            We implement industry-standard security measures
                            including HTTPS encryption, secure authentication
                            tokens, and restricted access controls to protect
                            your personal data.
                        </P>
                        <P>
                            No method of transmission over the internet is 100%
                            secure. While we strive to use commercially
                            acceptable means to protect your data, we cannot
                            guarantee absolute security.
                        </P>
                    </Section>

                    <Section title="Data Retention">
                        <P>
                            We retain your personal information for as long as
                            your account is active or as needed to provide you
                            services. Order records are retained for up to 7
                            years as required by Indian tax law. You may request
                            deletion of your account at any time.
                        </P>
                    </Section>

                    <Section title="Your Rights">
                        <P>
                            You have the following rights with respect to your
                            personal data:
                        </P>
                        <BulletList
                            items={[
                                "Right to access: request a copy of the data we hold about you.",
                                "Right to correction: request that we correct inaccurate or incomplete data.",
                                "Right to deletion: request that we delete your personal data, subject to legal obligations.",
                                "Right to opt out: unsubscribe from marketing communications at any time.",
                            ]}
                        />
                        <P>
                            To exercise any of these rights, please contact us
                            at{" "}
                            <a
                                href="mailto:support@sanasilver.com"
                                className="text-accent-2 underline underline-offset-2 hover:text-text-primary transition-colors"
                            >
                                support@sanasilver.com
                            </a>
                            .
                        </P>
                    </Section>

                    <Section title="Third-Party Links">
                        <P>
                            Our website may contain links to third-party sites.
                            We are not responsible for the content or privacy
                            practices of those sites. We encourage you to review
                            the privacy policy of any external site you visit.
                        </P>
                    </Section>

                    <Section title="Changes to This Policy">
                        <P>
                            We may update this Privacy Policy from time to time.
                            Changes will be posted on this page with an updated
                            date. We encourage you to review this page
                            periodically.
                        </P>
                    </Section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
