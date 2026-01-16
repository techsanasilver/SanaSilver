/**
 * Loader Component
 * Reusable loading spinner with different sizes and variants
 */

import React from "react";

const Loader = ({
    size = "md",
    variant = "primary",
    fullScreen = false,
    text = null,
}) => {
    // Size classes
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4",
        xl: "w-16 h-16 border-4",
    };

    // Variant colors
    const variantClasses = {
        primary: "border-primary border-t-transparent",
        secondary: "border-secondary border-t-transparent",
        accent: "border-accent border-t-transparent",
        white: "border-white border-t-transparent",
    };

    // Combine classes
    const spinnerClasses = `
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        rounded-full
        animate-spin
    `
        .trim()
        .replace(/\s+/g, " ");

    // Text size classes
    const textSizeClasses = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
    };

    // Full screen wrapper
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="flex flex-col items-center gap-4">
                    <div className={spinnerClasses} />
                    {text && (
                        <p
                            className={`${textSizeClasses[size]} text-text font-medium`}
                        >
                            {text}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Inline loader
    return (
        <div className="flex items-center gap-3">
            <div className={spinnerClasses} />
            {text && (
                <span className={`${textSizeClasses[size]} text-text`}>
                    {text}
                </span>
            )}
        </div>
    );
};

export default Loader;
