/**
 * Modal Component
 * Reusable modal wrapper with backdrop
 */

import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = "md",
    showCloseButton = true,
    closeOnBackdrop = true,
    footer,
}) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-full mx-4",
    };

    const handleBackdropClick = (e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div
                className={`bg-background-primary rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-fade-in`}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
                        {title && (
                            <h2 className="text-xl font-semibold text-text-primary">
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-background-secondary rounded-lg transition-colors ml-auto"
                                aria-label="Close modal"
                            >
                                <FiX className="w-5 h-5 text-text-primary" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-divider bg-background-secondary rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Confirmation Modal
 * Pre-configured modal for confirmations
 */
export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmButtonClass = "bg-accent-1 hover:bg-accent-2",
    isLoading = false,
}) => {
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 border border-divider rounded-lg hover:bg-background-secondary transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${confirmButtonClass}`}
                    >
                        {isLoading ? "Processing..." : confirmText}
                    </button>
                </div>
            }
        >
            <p className="text-text-secondary">{message}</p>
        </Modal>
    );
};

export default Modal;
