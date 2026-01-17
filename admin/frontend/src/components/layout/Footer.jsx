import React from "react";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="h-12 bg-surface border-t border-border flex items-center justify-between px-6 text-xs text-text-secondary">
            <div className="flex items-center gap-4">
                <span>© {currentYear} Sana Silver. All rights reserved.</span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
                <a href="#" className="hover:text-accent transition-colors">
                    Help
                </a>
                <a href="#" className="hover:text-accent transition-colors">
                    Privacy
                </a>
                <a href="#" className="hover:text-accent transition-colors">
                    Terms
                </a>
            </div>
        </footer>
    );
};

export default Footer;
