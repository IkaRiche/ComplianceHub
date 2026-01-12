import React from 'react';
import { SEOHead } from '../components/SEOHead.js';
import { FileCheck, BookOpen } from 'lucide-react';

export function En16931Validation() {
    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="EN 16931 Validation API - EU Standard Check"
                description="The EN 16931 validation API checks electronic invoices against the European semantic standard for e-invoicing."
                canonical="/en-16931-validation"
            />

            <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">EN 16931 Validation API</h1>

                <div className="prose prose-blue max-w-none text-gray-600 space-y-8">
                    <p className="text-xl leading-relaxed text-gray-700">
                        <strong>The EN 16931 validation API</strong> checks electronic invoices against the European semantic standard for e-invoicing.
                    </p>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                            Why EN 16931 Matters
                        </h2>
                        <p>
                            EN 16931 defines the mandatory data model for EU-compliant electronic invoices.
                        </p>
                        <p className="mt-2 text-red-600 font-medium">
                            Non-compliant invoices may be rejected by tax authorities or trading partners.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileCheck className="h-6 w-6 text-green-600" />
                            Validation Capabilities
                        </h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <li className="bg-gray-50 p-3 rounded-lg">Mandatory field checks</li>
                            <li className="bg-gray-50 p-3 rounded-lg">Business rule validation</li>
                            <li className="bg-gray-50 p-3 rounded-lg">Structural consistency</li>
                            <li className="bg-gray-50 p-3 rounded-lg">Deterministic scoring</li>
                        </ul>
                    </section>

                    <section className="border-t border-gray-200 pt-8 mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">FAQ</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">What is EN 16931 validation?</h3>
                                <p>It is the process of verifying invoice compliance with the EU e-invoicing standard.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">Is this API suitable for ERP integration?</h3>
                                <p>Yes. It is designed for automated, high-volume validation.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
