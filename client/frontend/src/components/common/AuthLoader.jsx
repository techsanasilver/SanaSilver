/**
 * AuthLoader Component
 * Minimal full-screen loader for authentication checks
 * Shows brand name "SANA" with glinting animation
 */
const AuthLoader = () => {
    return (
        <div className="fixed inset-0 bg-background-primary flex items-center justify-center z-50">
            <div className="relative">
                {/* SANA Text with Glint Effect */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold font-display tracking-[0.2em] text-accent-1">
                    SANA
                </h1>

                {/* Glint Animation Overlay */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full animate-glint bg-linear-to-r from-transparent via-white/30 to-transparent" />
                </div>
            </div>

            <style>{`
                @keyframes glint {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(200%);
                    }
                }
                
                .animate-glint {
                    animation: glint 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default AuthLoader;
