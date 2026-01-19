import React, { Component } from "react";
import logger from "../../utils/logger.util";
import { logErrorToBoundary } from "../../utils/errorHandler.util";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so next render shows fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        logErrorToBoundary(error, errorInfo);

        // Update state with error details
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback({
                    error: this.state.error,
                    errorInfo: this.state.errorInfo,
                    reset: this.handleReset,
                });
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4 min-w-screen">
                    <div className="max-w-md w-full bg-surface rounded-lg shadow-lg p-8 text-center">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-danger"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-text mb-2">
                                Oops! Something went wrong
                            </h2>
                            <p className="text-text-secondary">
                                We're sorry for the inconvenience. The
                                application has encountered an unexpected error.
                            </p>
                        </div>

                        {/* Show error details in development */}
                        {process.env.NODE_ENV !== "production" &&
                            this.state.error && (
                                <div className="mb-6 text-left">
                                    <details className="bg-danger/5 rounded-md p-4 text-sm">
                                        <summary className="cursor-pointer font-medium text-danger mb-2">
                                            Error Details
                                        </summary>
                                        <div className="space-y-2">
                                            <div>
                                                <p className="font-semibold text-text">
                                                    Message:
                                                </p>
                                                <p className="text-text-secondary font-mono text-xs break-all">
                                                    {this.state.error.toString()}
                                                </p>
                                            </div>
                                            {this.state.errorInfo && (
                                                <div>
                                                    <p className="font-semibold text-text">
                                                        Stack:
                                                    </p>
                                                    <pre className="text-text-secondary font-mono text-xs overflow-auto max-h-32">
                                                        {
                                                            this.state.errorInfo
                                                                .componentStack
                                                        }
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                </div>
                            )}

                        {/* Action buttons */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-2 bg-secondary text-text rounded-md hover:bg-secondary-dark transition-colors"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
