import React, { useEffect, useState } from 'react';
import { FileText, Shield, Zap, AlertCircle, Lock, ExternalLink } from 'lucide-react';
import { UploadDropzone } from '../components/UploadDropzone.js';
import { ValidationResults } from '../components/ValidationResults.js';
import { Settings } from '../components/Settings.js';
import { QuotaDisplay } from '../components/QuotaDisplay.js';
import { useAppStore } from '../store/appStore.js';
import { useApi } from '../hooks/useApi.js';
import { SEOHead } from '../components/SEOHead.js';
import { ThemeToggle } from '../components/ThemeToggle.js';

// Stripe Payment Link for €99 report
const REPORT_PAYMENT_URL = 'https://buy.stripe.com/00w00jefu8Gje7Q0bvfQI00?source=validator_ui';
const PRICING_URL = '/pricing';

export function ValidatorPage() {
    const [userTier, setUserTier] = useState<'free' | 'starter' | 'growth' | 'scale'>('free');

    const {
        vidaMode,
        denormalized,
        taxColumns,
        validationResult,
        reset,
        setValidationResult,
        setFlattenResult,
    } = useAppStore();

    const {
        error,
        validateFile,
        flattenFile,
        processFile,
        getQuota,
        clearError,
    } = useApi();

    // Load quota on mount
    useEffect(() => {
        const checkQuota = async () => {
            const quotaInfo = await getQuota();
            // Check if user has a paid tier (would be set via API key in production)
            if (quotaInfo?.tier && quotaInfo.tier !== 'free') {
                setUserTier(quotaInfo.tier);
            }
        };
        checkQuota();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFileUpload = async (file: File) => {
        try {
            clearError();
            reset();

            // File validation
            if (!file.name.toLowerCase().endsWith('.xml')) {
                throw new Error('Please upload UBL XML files only. Supported formats: .xml');
            }

            // For free tier, only validate (no flatten)
            if (userTier === 'free') {
                const result = await validateFile(file, vidaMode);
                setValidationResult(result);
                setFlattenResult(null);
            } else {
                // For paid tiers, validate + flatten
                const result = await processFile(file, {
                    vida: vidaMode,
                    denormalized,
                    taxColumns,
                });

                setValidationResult(result.validation);
                setFlattenResult(result.flattened);
            }
        } catch (err) {
            console.error('Upload error:', err);
        }
    };

    const handleDownloadCSV = async () => {
        // Paywall check
        if (userTier === 'free') {
            window.open(PRICING_URL, '_blank');
            return;
        }

        if (!validationResult) return;

        try {
            const csvData = generateCSVFromValidationResult(validationResult);

            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `validation_result_${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('CSV download error:', err);
            alert('CSV generation failed. Please try JSON download instead.');
        }
    };

    const generateCSVFromValidationResult = (result: any) => {
        const rows = [];

        rows.push(['Field', 'Value', 'Type']);
        rows.push(['Status', result.valid ? 'PASSED' : 'FAILED', 'Status']);
        rows.push(['Error Count', result.errors?.length || 0, 'Count']);
        rows.push(['Warning Count', result.warnings?.length || 0, 'Count']);
        rows.push(['Info Count', result.infos?.length || 0, 'Count']);

        if (result.vida) {
            rows.push(['ViDA Score', result.vida.score || 0, 'Score']);
            rows.push(['ViDA Aligned', result.vida.aligned ? 'YES' : 'NO', 'Status']);
        }

        rows.push(['', '', '']);

        if (result.errors?.length) {
            rows.push(['ERRORS', '', '']);
            rows.push(['Rule ID', 'Message', 'Type']);
            result.errors.forEach((error: any) => {
                rows.push([
                    error.ruleId || 'N/A',
                    error.message || error.description || 'No description',
                    'ERROR'
                ]);
            });
            rows.push(['', '', '']);
        }

        if (result.warnings?.length) {
            rows.push(['WARNINGS', '', '']);
            rows.push(['Rule ID', 'Message', 'Type']);
            result.warnings.forEach((warning: any) => {
                rows.push([
                    warning.ruleId || 'N/A',
                    warning.message || warning.description || 'No description',
                    'WARNING'
                ]);
            });
        }

        return rows.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    };

    const downloadJSON = () => {
        // Paywall check
        if (userTier === 'free') {
            window.open(PRICING_URL, '_blank');
            return;
        }

        if (!validationResult) return;

        const dataStr = JSON.stringify(validationResult, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `validation_result_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const downloadPDF = async () => {
        // For free tier, redirect to Stripe payment
        if (userTier === 'free') {
            window.open(REPORT_PAYMENT_URL, '_blank');
            return;
        }

        if (!validationResult) return;

        try {
            const { generateValidationPDF } = await import('../utils/simplePdfGenerator.js');
            generateValidationPDF(validationResult, {
                filename: `vida-validation-report-${Date.now()}.pdf`,
                includeDetailedErrors: true,
                includeWarnings: true,
            });
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('PDF generation failed. Please try downloading JSON instead.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <SEOHead
                title="ViDA UBL Validator Tool - Free Online Validation"
                description="Validate UBL XML invoices against EN 16931 and ViDA standards. Immediate feedback, secure processing."
                canonical="/validator"
            />

            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">ViDA UBL Validator</h1>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">by BauKlar • vida.bauklar.com</p>
                                </div>
                            </a>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Tier badge */}
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${userTier === 'free'
                                ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                }`}>
                                {userTier === 'free' ? 'Free Tier' : `${userTier.charAt(0).toUpperCase() + userTier.slice(1)} Plan`}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span className="hidden sm:inline">Secure</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <span className="hidden sm:inline">Fast</span>
                            </div>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Free Tier Banner */}
            {userTier === 'free' && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span className="text-sm">
                                Free tier: validation only. <strong>Upgrade for CSV/JSON export and official reports.</strong>
                            </span>
                        </div>
                        <a
                            href={PRICING_URL}
                            className="text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                            View Pricing <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Upload & Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        <UploadDropzone onFileSelect={handleFileUpload} />
                        <Settings />
                        <QuotaDisplay />
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-2">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-800">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    <div>
                                        <h3 className="font-medium text-red-700 dark:text-red-400">Error</h3>
                                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {validationResult ? (
                            <ValidationResults
                                result={validationResult}
                                onDownloadCSV={handleDownloadCSV}
                                onDownloadJSON={downloadJSON}
                                onDownloadPDF={downloadPDF}
                                userTier={userTier}
                            />
                        ) : (
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                                <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Ready to validate your UBL invoice
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                                    Upload a UBL XML invoice to get started with validation.
                                    Enable ViDA mode for compliance scoring against EU Digital Reporting Requirements.
                                </p>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                                        <div className="font-medium text-blue-700 dark:text-blue-300">25+ Validation Rules</div>
                                        <div className="text-blue-600 dark:text-blue-400">EN 16931 v2, Peppol BIS 4.0</div>
                                    </div>
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <FileText className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                                        <div className="font-medium text-green-700 dark:text-green-300">ViDA Score</div>
                                        <div className="text-green-600 dark:text-green-400">0-100 compliance rating</div>
                                    </div>
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                                        <div className="font-medium text-amber-700 dark:text-amber-300">Fast & Secure</div>
                                        <div className="text-amber-600 dark:text-amber-400">No file storage</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-6">
                        {/* API Integration Section */}
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                            <details className="group">
                                <summary className="cursor-pointer hover:text-blue-600 font-medium text-gray-700 dark:text-gray-300">
                                    🔗 API Integration • Automate UBL validation in your apps
                                </summary>
                                <div className="mt-4 space-y-3">
                                    <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
                                        <div className="text-green-400"># Validate UBL with ViDA scoring</div>
                                        <div>curl -X POST -F "file=@invoice.xml" \</div>
                                        <div className="pl-4">-F "vida=true" \</div>
                                        <div className="pl-4 text-blue-300">https://vida.bauklar.com/api/validate</div>
                                        <div className="mt-2 text-green-400"># Response: {`{"vidaScore":85,"status":"ready","errors":[]}`}</div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Free tier: 10 requests/day • Paid: up to 50,000/month
                                        </span>
                                        <a
                                            href="/api-docs"
                                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                        >
                                            View API Docs <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                            </details>
                        </div>

                        {/* Main Footer */}
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                ViDA UBL Validator • by BauKlar • vida.bauklar.com
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-500">
                                v2026-01-12 • EN 16931 v2 & Peppol BIS 4.0
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
