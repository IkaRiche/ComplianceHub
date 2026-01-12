import React from 'react';
import { FileText, Shield, Zap, Check, ExternalLink, Code, Building, CreditCard, Lock } from 'lucide-react';

interface LandingPageProps {
    onTryFree: () => void;
}

export function LandingPage({ onTryFree }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">ViDA UBL Validator</h1>
                                <p className="text-xs text-gray-500">by BauKlar</p>
                            </div>
                        </div>
                        <nav className="flex items-center space-x-6">
                            <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</a>
                            <a href="https://vida.bauklar.com/docs" className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1">
                                API Docs <ExternalLink className="h-3 w-3" />
                            </a>
                            <button
                                onClick={onTryFree}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Try Free
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                        <Shield className="h-4 w-4 mr-2" />
                        EN 16931 v2 & Peppol BIS 4.0 Compliant
                    </div>

                    <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Official ViDA / EN 16931 Validation for
                        <span className="text-blue-600"> UBL Invoices</span>
                    </h1>

                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Developer-grade compliance utility for ERP, e-Invoicing, FinTech, and Peppol integrations.
                        Stateless API with official compliance reports.
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-12">
                        <button
                            onClick={onTryFree}
                            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2"
                        >
                            <Zap className="h-5 w-5" />
                            Try Free — 10 validations/day
                        </button>
                        <a
                            href="https://vida.bauklar.com/docs"
                            className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all flex items-center gap-2"
                        >
                            <Code className="h-5 w-5" />
                            API Documentation
                        </a>
                    </div>

                    {/* Quick features */}
                    <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            No file storage
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            GDPR-safe by design
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            Usage-based pricing
                        </div>
                    </div>
                </div>
            </section>

            {/* Who is this for */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Who is this for?</h2>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                        Built for developers and compliance engineers who need reliable, fast UBL validation
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Building, title: 'ERP / Accounting SaaS', desc: 'Validate invoices before sending' },
                            { icon: FileText, title: 'E-Invoicing Providers', desc: 'Ensure EN 16931 compliance' },
                            { icon: CreditCard, title: 'FinTech (VAT/Payments)', desc: 'Pre-validate for tax reporting' },
                            { icon: Code, title: 'System Integrators', desc: 'Peppol network compliance' },
                        ].map((item, i) => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <div className="p-3 bg-blue-50 rounded-lg w-fit mb-4">
                                    <item.icon className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple, usage-based pricing</h2>
                    <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                        Start free, scale as you grow. No subscriptions in code — just API keys and quotas.
                    </p>

                    {/* API Packages */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        {/* Free */}
                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 relative">
                            <h3 className="font-bold text-xl text-gray-900 mb-2">Free</h3>
                            <p className="text-4xl font-bold text-gray-900 mb-1">€0</p>
                            <p className="text-sm text-gray-500 mb-6">10 validations/day</p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500" />
                                    ViDA Score
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500" />
                                    Errors & warnings
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-400 line-through">
                                    CSV/JSON export
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-400 line-through">
                                    PDF reports
                                </li>
                            </ul>
                            <button
                                onClick={onTryFree}
                                className="w-full py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Start Free
                            </button>
                        </div>

                        {/* Starter */}
                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 relative">
                            <h3 className="font-bold text-xl text-gray-900 mb-2">Starter</h3>
                            <p className="text-4xl font-bold text-gray-900 mb-1">€49<span className="text-lg font-normal text-gray-500">/mo</span></p>
                            <p className="text-sm text-gray-500 mb-6">1,000 validations/mo</p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500" />
                                    Everything in Free
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500" />
                                    CSV/JSON export
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500" />
                                    API key access
                                </li>
                            </ul>
                            <a
                                href="mailto:api@bauklar.com?subject=Starter API Key Request"
                                className="block w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-center"
                            >
                                Get API Key
                            </a>
                        </div>

                        {/* Growth */}
                        <div className="bg-blue-600 rounded-2xl p-6 relative shadow-xl shadow-blue-600/20">
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                                POPULAR
                            </div>
                            <h3 className="font-bold text-xl text-white mb-2">Growth</h3>
                            <p className="text-4xl font-bold text-white mb-1">€199<span className="text-lg font-normal text-blue-200">/mo</span></p>
                            <p className="text-sm text-blue-200 mb-6">10,000 validations/mo</p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-sm text-white">
                                    <Check className="h-4 w-4 text-green-300" />
                                    Everything in Starter
                                </li>
                                <li className="flex items-center gap-2 text-sm text-white">
                                    <Check className="h-4 w-4 text-green-300" />
                                    Priority support
                                </li>
                                <li className="flex items-center gap-2 text-sm text-white">
                                    <Check className="h-4 w-4 text-green-300" />
                                    10x quota
                                </li>
                            </ul>
                            <a
                                href="mailto:api@bauklar.com?subject=Growth API Key Request"
                                className="block w-full py-3 rounded-lg bg-white text-blue-600 font-medium hover:bg-blue-50 transition-colors text-center"
                            >
                                Get API Key
                            </a>
                        </div>

                        {/* Scale */}
                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 relative">
                            <h3 className="font-bold text-xl text-gray-900 mb-2">Scale</h3>
                            <p className="text-4xl font-bold text-gray-900 mb-1">€799<span className="text-lg font-normal text-gray-500">/mo</span></p>
                            <p className="text-sm text-gray-500 mb-6">50,000 validations/mo</p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500" />
                                    Everything in Growth
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500" />
                                    Dedicated support
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600">
                                    <Check className="h-4 w-4 text-green-500" />
                                    Custom integrations
                                </li>
                            </ul>
                            <a
                                href="mailto:api@bauklar.com?subject=Scale API Key Request"
                                className="block w-full py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
                            >
                                Contact Sales
                            </a>
                        </div>
                    </div>

                    {/* One-off Product */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-3">
                                    <FileText className="h-4 w-4 mr-2" />
                                    One-off Product
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Official ViDA / EN 16931 Compliance Audit
                                </h3>
                                <p className="text-gray-600 max-w-xl">
                                    Signed PDF report with file hash, timestamp, detailed checklist, and executive summary.
                                    Perfect for audits and compliance documentation.
                                </p>
                            </div>
                            <div className="text-center md:text-right">
                                <p className="text-4xl font-bold text-gray-900 mb-2">€99<span className="text-lg font-normal text-gray-500">/file</span></p>
                                <a
                                    href="https://buy.stripe.com/PLACEHOLDER_STRIPE_LINK?source=validator_ui"
                                    className="inline-block px-6 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                    Purchase Report
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Security */}
            <section className="py-16 px-4 bg-gray-900 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <Lock className="h-12 w-12 text-green-400 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">Security & GDPR by Design</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Your data never leaves our processing pipeline. No storage, no persistence, no risk.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: 'No File Storage', desc: 'Files are processed in-memory and immediately discarded' },
                            { title: 'Stateless Processing', desc: 'No data persistence between requests' },
                            { title: 'GDPR Compliant', desc: 'No personal data collected or stored' },
                        ].map((item, i) => (
                            <div key={i} className="bg-gray-800 rounded-xl p-6">
                                <Check className="h-6 w-6 text-green-400 mx-auto mb-3" />
                                <h3 className="font-semibold mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-400">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-gray-200">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">ViDA UBL Validator</p>
                            <p className="text-sm text-gray-500">by BauKlar</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                        <a href="https://vida.bauklar.com/docs" className="hover:text-gray-900">API Docs</a>
                        <a href="mailto:api@bauklar.com" className="hover:text-gray-900">Contact</a>
                        <a href="https://bauklar.com/privacy" className="hover:text-gray-900">Privacy</a>
                        <a href="https://bauklar.com/terms" className="hover:text-gray-900">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
