import React from 'react';
import { SEOHead } from '../components/SEOHead.js';
import { HelpCircle } from 'lucide-react';

export function Faq() {
    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="Frequently Asked Questions - ViDA UBL Validator"
                description="Common questions about the ViDA UBL Validator, data privacy, and compliance."
                canonical="/faq"
            />

            <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <HelpCircle className="h-10 w-10 text-blue-600" />
                    Frequently Asked Questions
                </h1>

                <div className="space-y-8">
                    {[
                        { q: 'Do you store invoices?', a: 'No. All invoices are processed in memory only.' },
                        { q: 'Is this a SaaS platform?', a: 'No. It is a stateless compliance utility.' },
                        { q: 'Can this be integrated into ERP systems?', a: 'Yes, via API.' },
                        { q: 'Do you provide subscriptions?', a: 'API usage is quota-based. No subscriptions in v1.' },
                        { q: 'Is the validator production-ready?', a: 'Yes. It is designed for deterministic, repeatable validation.' }
                    ].map((item, i) => (
                        <div key={i} className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-900 text-lg mb-2">{item.q}</h3>
                            <p className="text-gray-600">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
