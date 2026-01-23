/**
 * EcosystemShell Component
 * Unified top bar and application shell for all BauKlar products.
 * Defines the "Ecosystem" look and feel.
 */

import React from 'react';

// Mock Auth Hook (Integrate with your actual AuthContext)
// In VIDA, if there is no unified auth yet, we check localStorage or null
const useAuth = () => {
    // Basic implementation: check if user is logged in
    // This should be replaced with real auth logic integration
    return { user: null };
};

interface EcosystemShellProps {
    productName: string;
    productIcon?: string; // Emoji or SVG path
    children: React.ReactNode;
    hideAuth?: boolean;
    className?: string; // For custom layout overrides if absolutely needed
}

export const EcosystemShell: React.FC<EcosystemShellProps> = ({
    productName,
    productIcon,
    children,
    hideAuth = false,
    className = ''
}) => {
    const { user } = useAuth();

    // Construct login URL with target back to current tool
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://vida.bauklar.com';
    const loginUrl = `https://app.bauklar.com/login?target=${encodeURIComponent(currentUrl)}`;

    return (
        <div className={`min-h-screen bg-[var(--bk-bg-dark)] text-[var(--bk-text-primary)] font-[var(--bk-font-family)] ${className}`}>
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--bk-bg-dark)]/80 backdrop-blur-md border-b border-[var(--bk-border)] z-50 flex items-center justify-between px-6">

                {/* Left: Brand & Product */}
                <div className="flex items-center gap-6">
                    {/* Main Logo -> Launchpad */}
                    <a
                        href="https://app.bauklar.com/launchpad"
                        className="flex items-center gap-2 group text-white/80 hover:text-white transition-colors"
                        title="Back to Launchpad"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center text-xs font-black text-white">
                            BK
                        </div>
                        <span className="font-bold tracking-tight hidden md:block">
                            BauKlar <span className="text-[var(--bk-accent-blue)]">OS</span>
                        </span>
                    </a>

                    {/* Divider */}
                    <div className="h-4 w-px bg-[var(--bk-border)] hidden md:block"></div>

                    {/* Product Identity */}
                    <div className="flex items-center gap-2">
                        {productIcon && <span className="text-xl">{productIcon}</span>}
                        <span className="font-semibold text-sm md:text-base tracking-tight text-white">
                            {productName}
                        </span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    {/* Launchpad Link (Always visible) */}
                    <a
                        href="https://app.bauklar.com/launchpad"
                        className="p-2 rounded-lg text-[var(--bk-text-muted)] hover:text-white hover:bg-white/5 transition-all"
                        title="Open Launchpad"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </a>

                    {/* Auth Area */}
                    {!hideAuth && (
                        <div className="flex items-center border-l border-[var(--bk-border)] pl-4">
                            {user ? (
                                // User Account Menu (Minimal)
                                <a
                                    href="https://app.bauklar.com/settings"
                                    className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
                                >
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[var(--bk-accent-blue)] to-purple-500 flex items-center justify-center text-[10px] text-white">
                                        {'U'}
                                    </div>
                                    <span className="hidden lg:block">User</span>
                                </a>
                            ) : (
                                // Sign In Button
                                <a
                                    href={loginUrl}
                                    className="text-xs font-bold uppercase tracking-wider px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all text-white"
                                >
                                    Sign In
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Content Area (with top padding for fixed header) */}
            <main className="pt-16 min-h-screen">
                {children}
            </main>
        </div>
    );
};
