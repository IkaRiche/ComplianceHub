import React from 'react';
import { SEOHead } from '../components/SEOHead.js';
import { Copy, Terminal } from 'lucide-react';

export function ApiDocs() {
    return (
        <div className="min-h-screen bg-white">
            <SEOHead
                title="API Documentation - ViDA UBL Validator"
                description="Developer documentation for the ViDA UBL Validator API. Endpoints, authentication, and examples."
                canonical="/api-docs"
            />

            <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">API Documentation</h1>

                <div className="space-y-12">
                    {/* Base URL */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Base URL</h2>
                        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
                            https://vida.bauklar.com/api
                        </div>
                    </section>

                    {/* Authentication */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
                        <p className="text-gray-600 mb-4">
                            Paid access uses <strong>Bearer token authentication</strong>:
                        </p>
                        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300">
                            Authorization: Bearer YOUR_API_KEY
                        </div>
                        <p className="text-gray-600 mt-4 text-sm">
                            Unauthenticated requests use the free tier quota.
                        </p>
                    </section>

                    {/* Endpoints */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Endpoints</h2>

                        <div className="space-y-8">
                            {/* Validate */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-mono font-bold text-sm">POST</span>
                                    <span className="font-mono text-gray-700">/validate</span>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-600 mb-4">Validate a UBL invoice.</p>
                                    <h4 className="font-semibold text-gray-900 mb-2">Response:</h4>
                                    <pre className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                                        {`{
  "vidaScore": 82,
  "status": "needs_fixes",
  "errors": [],
  "warnings": []
}`}
                                    </pre>
                                </div>
                            </div>

                            {/* Flatten */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-mono font-bold text-sm">POST</span>
                                    <span className="font-mono text-gray-700">/flatten</span>
                                    <span className="ml-auto bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">PAID</span>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-600 mb-2">Export invoice data as CSV or JSON.</p>
                                    <p className="text-sm text-gray-500">Returns <strong>403</strong> for free tier.</p>
                                </div>
                            </div>

                            {/* Report */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-mono font-bold text-sm">POST</span>
                                    <span className="font-mono text-gray-700">/report</span>
                                    <span className="ml-auto bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">PRODUCT</span>
                                </div>
                                <div className="p-6">
                                    <p className="text-gray-600 mb-2">Generates an <strong>Official ViDA / EN 16931 Compliance Audit (PDF)</strong>.</p>
                                    <p className="text-sm text-gray-500">Returns <strong>402 Payment Required</strong> if not purchased.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Error Handling */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Handling</h2>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meaning</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">401</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">Invalid API key</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">402</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">Quota exceeded / payment required</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">403</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">Upgrade required</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Example */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Example</h2>
                        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto relative group">
                            <pre>
                                {`curl -X POST \\
  -H "Authorization: Bearer sk_xxx" \\
  -F "file=@invoice.xml" \\
  https://vida.bauklar.com/api/validate`}
                            </pre>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                            <Terminal className="h-4 w-4" />
                            Copy and paste into your terminal to test
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
