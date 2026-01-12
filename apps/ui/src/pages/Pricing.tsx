import React from 'react';
import { SEOHead } from '../components/SEOHead.js';
import { Check } from 'lucide-react';

export function Pricing() {
    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="Pricing - ViDA UBL Validator"
                description="Simple, usage-based pricing for UBL validation. Start free, scale as you grow."
                canonical="/pricing"
            />

            <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">Simple, usage-based pricing</h1>
                <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
                    Start free, scale as you grow. No subscriptions in code — just API keys and quotas.
                </p>

                {/* Reuse the pricing grid logic here, slightly modified for standalone page context */}
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
                        <a
                            href="/validator"
                            className="block w-full py-3 rounded-lg border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
                        >
                            Start Free
                        </a>
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
            </div>
        </div>
    );
}
