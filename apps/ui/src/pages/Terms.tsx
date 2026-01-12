import React from 'react';
import { SEOHead } from '../components/SEOHead.js';

export function Terms() {
    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="Terms of Service - ViDA UBL Validator"
                description="Terms of Service for using the ViDA UBL Validator API and web tools."
                canonical="/terms"
            />

            <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

                <div className="prose prose-blue max-w-none text-gray-600 space-y-8">
                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Description</h3>
                        <p>
                            The ViDA UBL Validator provides automated validation of electronic invoices against <strong>ViDA</strong> and <strong>EN 16931</strong> requirements.
                        </p>
                        <p className="mt-2">
                            The service is provided as a <strong>technical compliance utility</strong>.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Warranty</h3>
                        <p>
                            The service is provided <strong>“as is”</strong>, without warranties of any kind.
                        </p>
                        <p className="mt-2">
                            Validation results are informational and <strong>do not constitute legal, tax, or accounting advice</strong>.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
                        <p>We are not liable for:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>business decisions made based on validation results,</li>
                            <li>regulatory outcomes,</li>
                            <li>financial or compliance consequences.</li>
                        </ul>
                        <p className="mt-2">
                            Users remain fully responsible for their invoices and regulatory compliance.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Availability</h3>
                        <p>No service-level agreement (SLA) is provided in v1.</p>
                        <p className="mt-2">The service may be modified or discontinued at any time.</p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Acceptable Use</h3>
                        <p>You agree not to:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>abuse the service,</li>
                            <li>attempt to bypass quota or payment restrictions,</li>
                            <li>submit malicious or non-invoice content.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Governing Law</h3>
                        <p>
                            These terms are governed by <strong>European Union law</strong>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
