import React from "react";
import { Link } from "react-router-dom";
import {
    FiFacebook,
    FiInstagram,
    FiTwitter,
    FiMail,
    FiPhone,
} from "react-icons/fi";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-background-invert text-text-primary-invert border-t border-divider/20">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Sana Silver</h3>
                        <p className="text-sm text-text-secondary-invert mb-4">
                            Timeless silver jewellery crafted with passion and
                            precision.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-background-secondary/10 hover:bg-background-secondary/20 rounded-lg transition-colors"
                                aria-label="Facebook"
                            >
                                <FiFacebook className="w-5 h-5" />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-background-secondary/10 hover:bg-background-secondary/20 rounded-lg transition-colors"
                                aria-label="Instagram"
                            >
                                <FiInstagram className="w-5 h-5" />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-background-secondary/10 hover:bg-background-secondary/20 rounded-lg transition-colors"
                                aria-label="Twitter"
                            >
                                <FiTwitter className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-base font-semibold mb-4">
                            Quick Links
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/shop"
                                    className="text-sm text-text-secondary-invert hover:text-text-primary-invert transition-colors"
                                >
                                    Shop
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/about"
                                    className="text-sm text-text-secondary-invert hover:text-text-primary-invert transition-colors"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/contact"
                                    className="text-sm text-text-secondary-invert hover:text-text-primary-invert transition-colors"
                                >
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/track-order"
                                    className="text-sm text-text-secondary-invert hover:text-text-primary-invert transition-colors"
                                >
                                    Track Order
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="text-base font-semibold mb-4">
                            Customer Service
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/faq"
                                    className="text-sm text-text-secondary-invert hover:text-text-primary-invert transition-colors"
                                >
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/shipping"
                                    className="text-sm text-text-secondary-invert hover:text-text-primary-invert transition-colors"
                                >
                                    Shipping & Delivery
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/returns"
                                    className="text-sm text-text-secondary-invert hover:text-text-primary-invert transition-colors"
                                >
                                    Returns & Exchanges
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/privacy"
                                    className="text-sm text-text-secondary-invert hover:text-text-primary-invert transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/terms"
                                    className="text-sm text-text-secondary-invert hover:text-text-primary-invert transition-colors"
                                >
                                    Terms & Conditions
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-base font-semibold mb-4">
                            Contact Us
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-sm text-text-secondary-invert">
                                <FiMail className="w-4 h-4" />
                                <a
                                    href="mailto:support@sanasilver.com"
                                    className="hover:text-text-primary-invert transition-colors"
                                >
                                    support@sanasilver.com
                                </a>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-text-secondary-invert">
                                <FiPhone className="w-4 h-4" />
                                <a
                                    href="tel:+919876543210"
                                    className="hover:text-text-primary-invert transition-colors"
                                >
                                    +91 98765 43210
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-8 pt-8 border-t border-divider/20 text-center">
                    <p className="text-sm text-text-secondary-invert">
                        © {currentYear} Sana Silver. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
