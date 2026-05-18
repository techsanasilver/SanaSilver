import { useState } from "react";
import { Link } from "react-router-dom";
import {
    FiMail,
    FiPhone,
    FiMapPin,
    FiInstagram,
    FiFacebook,
    FiChevronRight,
    FiClock,
    FiCheck,
} from "react-icons/fi";

const CONTACT_INFO = [
    {
        icon: FiMail,
        label: "Email Us",
        value: "support@sanasilver.com",
        sub: "We respond within 24 hours",
        href: "mailto:support@sanasilver.com",
    },
    {
        icon: FiPhone,
        label: "Call Us",
        value: "+91 98765 43210",
        sub: "Mon – Fri, 9 AM – 6 PM IST",
        href: "tel:+919876543210",
    },
    {
        icon: FiMapPin,
        label: "Visit Us",
        value: "Mumbai, Maharashtra, India",
        sub: "By appointment only",
        href: null,
    },
];

const SOCIAL_LINKS = [
    {
        icon: FiInstagram,
        label: "Instagram",
        handle: "@sanasilver",
        href: "https://instagram.com",
    },
    {
        icon: FiFacebook,
        label: "Facebook",
        handle: "Sana Silver",
        href: "https://facebook.com",
    },
];

const QUICK_LINKS = [
    { label: "FAQ", to: "/faq" },
    { label: "Shipping Policy", to: "/shipping" },
    { label: "Returns & Refunds", to: "/returns" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms & Conditions", to: "/terms" },
];

const emptyForm = {
    name: "",
    email: "",
    subject: "",
    message: "",
};

const ContactUs = () => {
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const set = (field) => (e) =>
        setForm((p) => ({ ...p, [field]: e.target.value }));

    const validate = () => {
        const err = {};
        if (!form.name.trim()) err.name = "Name is required";
        if (!form.email.trim()) err.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email))
            err.email = "Invalid email address";
        if (!form.subject.trim()) err.subject = "Subject is required";
        if (!form.message.trim()) err.message = "Message is required";
        else if (form.message.trim().length < 20)
            err.message =
                "Please provide a bit more detail (at least 20 characters)";
        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);

        // TODO: Integrate MSG91 to deliver contact form submissions to the company.
        //
        // MSG91 options:
        //   • Email API  — send a transactional email to support@sanasilver.com with form data
        //   • WhatsApp API — send a WhatsApp message to the support number
        //   • SMS API    — optional SMS alert for urgent enquiries
        //
        // Suggested backend endpoint: POST /api/contact
        // The endpoint should:
        //   1. Validate & sanitise the payload (name, email, subject, message)
        //   2. Call MSG91 Email/WhatsApp API with the business auth key
        //   3. Optionally persist the enquiry in the DB for tracking
        //   4. Return { success: true } on success
        //
        // Replace the placeholder below with:
        //   const res = await contactApi.sendMessage(form);
        //   if (!res.success) throw new Error(res.message);

        // ── Placeholder (remove once MSG91 is wired up) ──────────────────────
        await new Promise((resolve) => setTimeout(resolve, 1200));
        // ─────────────────────────────────────────────────────────────────────

        setSubmitting(false);
        setSubmitted(true);
        setForm(emptyForm);
        setErrors({});
    };

    return (
        <div className="bg-background-secondary min-h-[calc(100vh-4rem)]">
            {/* Page Header */}
            <div className="bg-background-primary border-b border-divider py-12 md:py-16">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs md:text-sm text-accent-2 uppercase tracking-widest mb-4 md:mb-6">
                        GET IN TOUCH
                    </p>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-text-primary mb-4">
                        Contact Us
                    </h1>
                    <p className="text-sm md:text-base text-text-muted font-light max-w-xl mx-auto">
                        Have a question, a custom order request, or simply want
                        to say hello? We'd love to hear from you.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 md:py-16 pb-32">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
                        {/* ── Left column: contact info ── */}
                        <div className="lg:col-span-2 space-y-10">
                            {/* Contact details */}
                            <div className="space-y-5">
                                {CONTACT_INFO.map(
                                    ({
                                        icon: Icon,
                                        label,
                                        value,
                                        sub,
                                        href,
                                    }) => (
                                        <div key={label} className="flex gap-4">
                                            <div className="w-10 h-10 rounded-sm bg-background-primary border border-divider flex items-center justify-center shrink-0">
                                                <Icon className="w-4 h-4 text-accent-2" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-accent-2 uppercase tracking-widest mb-0.5">
                                                    {label}
                                                </p>
                                                {href ? (
                                                    <a
                                                        href={href}
                                                        className="text-sm font-medium text-text-primary hover:text-accent-2 transition-colors"
                                                    >
                                                        {value}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm font-medium text-text-primary">
                                                        {value}
                                                    </p>
                                                )}
                                                <p className="text-xs text-text-muted font-light mt-0.5">
                                                    {sub}
                                                </p>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>

                            {/* Business hours */}
                            <div className="bg-background-primary border border-divider rounded-sm p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <FiClock className="w-4 h-4 text-accent-2" />
                                    <p className="text-xs text-accent-2 uppercase tracking-widest">
                                        Business Hours
                                    </p>
                                </div>
                                <ul className="space-y-2">
                                    {[
                                        [
                                            "Monday – Friday",
                                            "9:00 AM – 6:00 PM",
                                        ],
                                        ["Saturday", "10:00 AM – 4:00 PM"],
                                        ["Sunday", "Closed"],
                                    ].map(([day, time]) => (
                                        <li
                                            key={day}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-text-secondary font-light">
                                                {day}
                                            </span>
                                            <span className="text-text-primary font-medium">
                                                {time}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-text-muted font-light mt-4 border-t border-divider pt-3">
                                    All times are in Indian Standard Time (IST).
                                </p>
                            </div>

                            {/* Social links */}
                            <div>
                                <p className="text-xs text-accent-2 uppercase tracking-widest mb-4">
                                    Follow Us
                                </p>
                                <div className="space-y-3">
                                    {SOCIAL_LINKS.map(
                                        ({
                                            icon: Icon,
                                            label,
                                            handle,
                                            href,
                                        }) => (
                                            <a
                                                key={label}
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 text-sm text-text-secondary hover:text-text-primary transition-colors group"
                                            >
                                                <span className="w-8 h-8 rounded-sm bg-background-primary border border-divider flex items-center justify-center group-hover:border-accent-2 transition-colors">
                                                    <Icon className="w-3.5 h-3.5 text-accent-2" />
                                                </span>
                                                <span>
                                                    <span className="font-medium text-text-primary">
                                                        {label}
                                                    </span>{" "}
                                                    <span className="font-light">
                                                        {handle}
                                                    </span>
                                                </span>
                                            </a>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Quick help links */}
                            <div>
                                <p className="text-xs text-accent-2 uppercase tracking-widest mb-4">
                                    Quick Help
                                </p>
                                <ul className="space-y-1">
                                    {QUICK_LINKS.map(({ label, to }) => (
                                        <li key={to}>
                                            <Link
                                                to={to}
                                                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors py-1 group"
                                            >
                                                <FiChevronRight className="w-3.5 h-3.5 text-accent-2 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                                                {label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* ── Right column: contact form ── */}
                        <div className="lg:col-span-3">
                            <div className="bg-background-primary border border-divider rounded-sm p-6 md:p-8">
                                {submitted ? (
                                    /* Success state */
                                    <div className="flex flex-col items-center justify-center text-center py-12">
                                        <div className="w-14 h-14 rounded-full bg-accent-1/20 flex items-center justify-center mb-5">
                                            <FiCheck className="w-7 h-7 text-accent-1" />
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-display font-medium text-text-primary mb-3">
                                            Message Sent
                                        </h2>
                                        <p className="text-sm text-text-secondary font-light mb-8 max-w-xs">
                                            Thank you for reaching out. We'll
                                            get back to you within 24 hours.
                                        </p>
                                        <button
                                            onClick={() => setSubmitted(false)}
                                            className="text-xs uppercase tracking-widest text-accent-2 hover:text-text-primary border-b border-accent-2 hover:border-text-primary transition-colors pb-0.5"
                                        >
                                            Send another message
                                        </button>
                                    </div>
                                ) : (
                                    /* Form */
                                    <>
                                        <div className="mb-7">
                                            <h2 className="text-xl md:text-2xl font-display font-medium text-text-primary mb-1">
                                                Send a Message
                                            </h2>
                                            <p className="text-sm text-text-secondary font-light">
                                                Fill in the form below and we'll
                                                be in touch soon.
                                            </p>
                                        </div>

                                        <form
                                            onSubmit={handleSubmit}
                                            noValidate
                                            className="space-y-5"
                                        >
                                            {/* Name + Email row */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">
                                                        Full Name{" "}
                                                        <span className="text-accent-2">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={form.name}
                                                        onChange={set("name")}
                                                        placeholder="Priya Sharma"
                                                        className={`w-full px-4 py-3 bg-background-secondary border text-sm text-text-primary placeholder-text-muted font-light focus:outline-none focus:border-accent-2 transition-colors ${
                                                            errors.name
                                                                ? "border-danger"
                                                                : "border-divider"
                                                        }`}
                                                    />
                                                    {errors.name && (
                                                        <p className="text-xs text-danger mt-1.5">
                                                            {errors.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">
                                                        Email{" "}
                                                        <span className="text-accent-2">
                                                            *
                                                        </span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={form.email}
                                                        onChange={set("email")}
                                                        placeholder="you@example.com"
                                                        className={`w-full px-4 py-3 bg-background-secondary border text-sm text-text-primary placeholder-text-muted font-light focus:outline-none focus:border-accent-2 transition-colors ${
                                                            errors.email
                                                                ? "border-danger"
                                                                : "border-divider"
                                                        }`}
                                                    />
                                                    {errors.email && (
                                                        <p className="text-xs text-danger mt-1.5">
                                                            {errors.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Subject */}
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">
                                                    Subject{" "}
                                                    <span className="text-accent-2">
                                                        *
                                                    </span>
                                                </label>
                                                <select
                                                    value={form.subject}
                                                    onChange={set("subject")}
                                                    className={`w-full px-4 py-3 bg-background-secondary border text-sm font-light focus:outline-none focus:border-accent-2 transition-colors appearance-none cursor-pointer ${
                                                        errors.subject
                                                            ? "border-danger text-danger"
                                                            : "border-divider text-text-primary"
                                                    } ${
                                                        !form.subject
                                                            ? "text-text-muted"
                                                            : "text-text-primary"
                                                    }`}
                                                >
                                                    <option value="" disabled>
                                                        Select a topic
                                                    </option>
                                                    <option value="Order Enquiry">
                                                        Order Enquiry
                                                    </option>
                                                    <option value="Custom / Engraving Request">
                                                        Custom / Engraving
                                                        Request
                                                    </option>
                                                    <option value="Return or Exchange">
                                                        Return or Exchange
                                                    </option>
                                                    <option value="Product Question">
                                                        Product Question
                                                    </option>
                                                    <option value="Wholesale / Bulk">
                                                        Wholesale / Bulk
                                                    </option>
                                                    <option value="Other">
                                                        Other
                                                    </option>
                                                </select>
                                                {errors.subject && (
                                                    <p className="text-xs text-danger mt-1.5">
                                                        {errors.subject}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Message */}
                                            <div>
                                                <label className="block text-xs uppercase tracking-widest text-text-secondary mb-2">
                                                    Message{" "}
                                                    <span className="text-accent-2">
                                                        *
                                                    </span>
                                                </label>
                                                <textarea
                                                    rows={6}
                                                    value={form.message}
                                                    onChange={set("message")}
                                                    placeholder="Tell us how we can help…"
                                                    className={`w-full px-4 py-3 bg-background-secondary border text-sm text-text-primary placeholder-text-muted font-light focus:outline-none focus:border-accent-2 transition-colors resize-none ${
                                                        errors.message
                                                            ? "border-danger"
                                                            : "border-divider"
                                                    }`}
                                                />
                                                <div className="flex items-start justify-between mt-1">
                                                    {errors.message ? (
                                                        <p className="text-xs text-danger">
                                                            {errors.message}
                                                        </p>
                                                    ) : (
                                                        <span />
                                                    )}
                                                    <p className="text-xs text-text-muted font-light shrink-0 ml-2">
                                                        {form.message.length}{" "}
                                                        chars
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Submit */}
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="w-full py-3.5 bg-text-primary text-text-primary-invert text-xs uppercase tracking-widest font-normal hover:bg-accent-2 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <span className="w-4 h-4 border-2 border-text-primary-invert/30 border-t-text-primary-invert rounded-full animate-spin" />
                                                        Sending…
                                                    </>
                                                ) : (
                                                    "Send Message"
                                                )}
                                            </button>

                                            <p className="text-xs text-text-muted font-light text-center">
                                                By submitting this form you
                                                agree to our{" "}
                                                <Link
                                                    to="/privacy"
                                                    className="underline underline-offset-2 hover:text-text-secondary transition-colors"
                                                >
                                                    Privacy Policy
                                                </Link>
                                                .
                                            </p>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
