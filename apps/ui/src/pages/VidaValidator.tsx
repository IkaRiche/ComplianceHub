import React from 'react';
import { SEOHead } from '../components/SEOHead.js';
import { Shield, Users, CheckCircle } from 'lucide-react';

export function VidaValidator() {
    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="ViDA UBL Validator - EU Compliance Tool"
                description="A ViDA UBL validator checks whether an electronic invoice complies with the EU ViDA framework and EN 16931 standard."
                canonical="/vida-validator"
            />

            <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">ViDA UBL Validator</h1>

                <div className="prose prose-blue max-w-none text-gray-600 space-y-8">
                    <p className="text-xl leading-relaxed text-gray-700">
                        <strong>A ViDA UBL validator</strong> checks whether an electronic invoice complies with the EU ViDA framework and EN 16931 standard.
                    </p>
                    <p>
                        The ViDA UBL Validator validates invoice structure, mandatory fields, and business rules, and produces a deterministic compliance score.
                    </p>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is ViDA Validation?</h2>
                        <p>
                            ViDA (VAT in the Digital Age) introduces mandatory electronic invoicing and validation requirements across the EU.
                        </p>
                        <p className="mt-2">
                            This validator helps ERP systems, e-invoicing providers, and integrators verify compliance automatically.
                        </p>
                    </section>

                    <section className="bg-gray-50 p-6 rounded-xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="h-6 w-6 text-blue-600" />
                            Who Is This For?
                        </h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {['ERP and accounting software vendors', 'E-invoicing platforms', 'FinTech and VAT automation providers'].map((item, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <ol className="list-decimal pl-5 space-y-2 font-medium">
                            <li>Upload a UBL invoice</li>
                            <li>Validate against ViDA and EN 16931 rules</li>
                            <li>Receive a score, errors, and warnings</li>
                            <li>Optionally generate an official audit report</li>
                        </ol>
                    </section>

                    <section className="border-t border-gray-200 pt-8 mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">FAQ</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">What is a ViDA UBL validator?</h3>
                                <p>A ViDA UBL validator verifies whether an invoice meets EU ViDA and EN 16931 requirements.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">Is this suitable for production use?</h3>
                                <p>Yes. The validator is stateless, deterministic, and API-first.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">Do you store invoice data?</h3>
                                <p>No. All processing is in memory only.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
