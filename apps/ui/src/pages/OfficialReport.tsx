import React from 'react';
import { SEOHead } from '../components/SEOHead.js';
import { FileText, Check, Download } from 'lucide-react';

export function OfficialReport() {
    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="Official ViDA / EN 16931 Compliance Audit Report"
                description="Get an official signed PDF compliance report for your UBL invoices. Suitable for audits and internal reviews."
                canonical="/official-compliance-report"
            />

            <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">Official ViDA / EN 16931 Compliance Audit</h1>

                <div className="prose prose-blue max-w-none text-gray-600 space-y-8">
                    <p className="text-xl leading-relaxed text-gray-700">
                        The <strong>Official ViDA / EN 16931 Compliance Audit</strong> is a PDF document suitable for audits, onboarding, and internal compliance reviews.
                    </p>

                    <section className="bg-amber-50 p-8 rounded-2xl border border-amber-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">What the Report Contains</h2>
                        <ul className="space-y-3">
                            {[
                                'File metadata and cryptographic hash',
                                'ViDA compliance score',
                                'EN 16931 checklist',
                                'Detailed errors and warnings',
                                'Executive compliance summary'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="h-5 w-5 text-amber-600" />
                                    <span className="text-gray-900 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-gray-900 text-white p-8 rounded-2xl">
                        <div>
                            <h2 className="text-2xl font-bold mb-2 text-white">Pricing</h2>
                            <div className="text-3xl font-bold text-green-400">€99 <span className="text-lg text-gray-400 font-normal">per invoice</span></div>
                            <p className="text-gray-400 mt-2">One-time payment. No subscription required.</p>
                        </div>
                        <a
                            href="https://buy.stripe.com/PLACEHOLDER_STRIPE_LINK?source=validator_ui_report_page"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
                        >
                            <Download className="h-5 w-5" />
                            Purchase Report
                        </a>
                    </section>

                    <section className="border-t border-gray-200 pt-8 mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">FAQ</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">Is this report legally binding?</h3>
                                <p>No. It is an independent technical compliance assessment.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">Do you store the invoice?</h3>
                                <p>No. The report is generated without storing invoice content.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
