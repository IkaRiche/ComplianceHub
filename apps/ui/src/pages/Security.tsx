import React from 'react';
import { SEOHead } from '../components/SEOHead.js';
import { Shield, Lock, Server, FileCheck } from 'lucide-react';

export function Security() {
    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="Security & Data Handling - ViDA UBL Validator"
                description="Security architecture and data handling practices. Stateless processing, in-memory validation, and no file persistence."
                canonical="/security"
            />

            <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <Shield className="h-10 w-10 text-green-600" />
                    Security & Data Handling
                </h1>

                <div className="prose prose-blue max-w-none text-gray-600 space-y-8">
                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Architecture Overview</h3>
                        <p>
                            The ViDA UBL Validator is built as a <strong>stateless validation service</strong>.
                        </p>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                                <Server className="h-5 w-5 text-blue-600 mt-1" />
                                <div>
                                    <div className="font-semibold text-gray-900">Stateless</div>
                                    <div className="text-sm">No persistent storage of invoice files</div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                                <Lock className="h-5 w-5 text-blue-600 mt-1" />
                                <div>
                                    <div className="font-semibold text-gray-900">In-Memory</div>
                                    <div className="text-sm">Processing happens in RAM only</div>
                                </div>
                            </div>
                        </div>
                        <ul className="list-disc pl-5 mt-4 space-y-1">
                            <li>In-memory processing only</li>
                            <li>Deterministic validation rules</li>
                            <li>No user accounts</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">API Security</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Access to paid features is protected by <strong>API keys</strong></li>
                            <li>Quotas are enforced per key or per IP (free tier)</li>
                            <li>Abuse protection is implemented at the API layer</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Protection</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Invoice files exist only in memory during request processing</li>
                            <li>Files are destroyed immediately after response generation</li>
                            <li>Only technical quota metadata is stored</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">Verifiable Guarantees</h3>
                        <p>
                            Security and privacy claims are backed by <strong>automated tests</strong>, including:
                        </p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>API contract stability tests</li>
                            <li>Explicit “no persistence” tests verifying that invoice payloads are never stored</li>
                        </ul>
                    </section>

                    <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileCheck className="h-5 w-5 text-blue-600" />
                            Incident Contact
                        </h3>
                        <p>
                            For security-related inquiries: <br />
                            <a href="mailto:security@bauklar.com" className="text-blue-600 hover:text-blue-800 font-medium">security@bauklar.com</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
