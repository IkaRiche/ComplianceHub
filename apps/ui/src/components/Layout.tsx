import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, ExternalLink } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.js';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const navigate = useNavigate();

    const handleTryFree = () => {
        navigate('/validator');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">ViDA UBL Validator</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">by BauKlar</p>
                                </div>
                            </Link>
                        </div>
                        <nav className="flex items-center space-x-4 sm:space-x-6">
                            <Link to="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">Pricing</Link>
                            <Link to="/api-docs" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-1">
                                API Docs <ExternalLink className="h-3 w-3" />
                            </Link>
                            <ThemeToggle />
                            <button
                                onClick={handleTryFree}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Try Free
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>
                {children}
            </main>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">ViDA UBL Validator</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">by BauKlar</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <Link to="/api-docs" className="hover:text-gray-900 dark:hover:text-white transition-colors">API Docs</Link>
                        <a href="mailto:api@bauklar.com" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a>
                        <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
