import React from 'react';
import { SEOHead } from '../components/SEOHead.js';

export function Privacy() {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="Privacy Policy - ViDA UBL Validator"
                description="Privacy Policy for ViDA UBL Validator. We prioritize data minimization and do not store your invoice files."
                canonical="/privacy"
            />

            <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

                <div className="prose prose-blue max-w-none text-gray-600 space-y-8">
                    <p className="font-medium text-gray-500">Last updated: {today}</p>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Overview</h3>
                        <p>
                            This Privacy Policy explains how the <strong>ViDA UBL Validator</strong> (“we”, “our service”) processes data when validating electronic invoices.
                        </p>
                        <p className="mt-2">
                            Our service is designed with <strong>privacy by design</strong> and <strong>data minimization</strong> principles.
                        </p>
                    </section>

                    <section className="bg-green-50 p-6 rounded-xl border border-green-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">What Data We Do NOT Store</h3>
                        <p>We do <strong>not</strong> store:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>uploaded invoice files (UBL XML),</li>
                            <li>invoice content,</li>
                            <li>personal or financial data from invoices,</li>
                            <li>validation history.</li>
                        </ul>
                        <p className="mt-4 font-medium">
                            All invoice processing is performed <strong>in memory only</strong> and discarded immediately after the request is completed.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">What Data We Do Store</h3>
                        <p>We store <strong>limited technical metadata only</strong> for operational purposes:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>API key identifier (for paid usage),</li>
                            <li>quota counters (usage volume),</li>
                            <li>IP-based counters for unauthenticated free usage.</li>
                        </ul>
                        <p className="mt-2">
                            This data <strong>does not contain invoice content</strong> and cannot be used to reconstruct submitted files.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Retention</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Quota metadata is stored temporarily and automatically expires.</li>
                            <li>No long-term storage of invoice-related data exists.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">GDPR Compliance</h3>
                        <p>
                            Because invoice content is never persisted, the service is inherently <strong>GDPR-compliant by design</strong>.
                        </p>
                        <p className="mt-2">
                            No data processing agreements (DPA) are required for using the validator in its standard mode.
                        </p>
                    </section>

                    <section className="border-t border-gray-200 pt-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact</h3>
                        <p>
                            For privacy-related questions, contact: <br />
                            <a href="mailto:privacy@bauklar.com" className="text-blue-600 hover:text-blue-800 font-medium">privacy@bauklar.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
