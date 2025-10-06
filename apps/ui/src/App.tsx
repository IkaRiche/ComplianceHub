import React, { useEffect } from 'react';
import { FileText, Shield, Zap, AlertCircle } from 'lucide-react';
import { UploadDropzone } from './components/UploadDropzone.js';
import { ValidationResults } from './components/ValidationResults.js';
import { Settings } from './components/Settings.js';
import { QuotaDisplay } from './components/QuotaDisplay.js';
import { useAppStore } from './store/appStore.js';
import { useApi } from './hooks/useApi.js';

export default function App() {
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

  // Load quota on mount - only once
  useEffect(() => {
    getQuota();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileUpload = async (file: File) => {
    try {
      clearError();
      reset();
      
      // Additional file validation with friendly messages
      if (!file.name.toLowerCase().endsWith('.xml')) {
        throw new Error('Please upload UBL XML files only. Supported formats: .xml');
      }
      
      // Check for common UBL indicators in filename (optional but helpful)
      const fileName = file.name.toLowerCase();
      const isLikelyUBL = fileName.includes('invoice') || 
                         fileName.includes('ubl') || 
                         fileName.includes('rechnung') ||
                         fileName.includes('factur');
      
      if (!isLikelyUBL && file.size < 1024) {
        // Small non-UBL-looking files are likely wrong
        console.warn('File might not be UBL invoice:', file.name);
      }
      
      // Process file (validate + flatten)
      const result = await processFile(file, {
        vida: vidaMode,
        denormalized,
        taxColumns,
      });
      
      setValidationResult(result.validation);
      setFlattenResult(result.flattened);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleDownloadCSV = async () => {
    if (!validationResult) return;
    
    try {
      // Get the current file from the dropzone (we'd need to store this)
      // For now, show a message that they need to re-upload
      alert('Please re-upload your file and select CSV download during processing.');
    } catch (err) {
      console.error('CSV download error:', err);
    }
  };

  const downloadJSON = () => {
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
    if (!validationResult) return;
    
    try {
      const { generateValidationPDF } = await import('./utils/pdfGenerator.js');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ViDA UBL Validator</h1>
                <p className="text-sm text-gray-600">EN 16931 v2 & Peppol BIS 4.0 Compliance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-success-500" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Zap className="h-4 w-4 text-warning-500" />
                <span>Fast</span>
              </div>
            </div>
          </div>
        </div>
      </header>

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
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-error-500" />
                  <div>
                    <h3 className="font-medium text-error-700">Error</h3>
                    <p className="text-sm text-error-600 mt-1">{error}</p>
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
              />
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready to validate your UBL invoice
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Upload a UBL XML invoice to get started with validation and flattening. 
                  Enable ViDA mode for compliance scoring against EU Digital Reporting Requirements.
                </p>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <Shield className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                    <div className="font-medium text-primary-700">25+ Validation Rules</div>
                    <div className="text-primary-600">EN 16931 v2, Peppol BIS 4.0</div>
                  </div>
                  <div className="p-4 bg-success-50 rounded-lg">
                    <FileText className="h-6 w-6 text-success-600 mx-auto mb-2" />
                    <div className="font-medium text-success-700">CSV/JSON Export</div>
                    <div className="text-success-600">Flattened data formats</div>
                  </div>
                  <div className="p-4 bg-warning-50 rounded-lg">
                    <Zap className="h-6 w-6 text-warning-600 mx-auto mb-2" />
                    <div className="font-medium text-warning-700">ViDA Compliance</div>
                    <div className="text-warning-600">Score & checklist</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* API Integration Section */}
            <div className="border-b border-gray-200 pb-6">
              <details className="group">
                <summary className="cursor-pointer hover:text-primary-600 font-medium text-gray-700">
                  🔗 API Integration • Automate UBL validation in your apps
                </summary>
                <div className="mt-4 space-y-3">
                  <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
                    <div className="text-green-400"># Validate UBL with ViDA scoring</div>
                    <div>curl -X POST -F "file=@invoice.xml" \</div>
                    <div className="pl-4">-F "vida=true" \</div>
                    <div className="pl-4 text-blue-300">https://compliancehub-api.heizungsrechner.workers.dev/api/validate</div>
                    <div className="mt-2 text-green-400"># Response: {"{'success':true,'data':{'score':80,'aligned':true}}"}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Free tier: 100 requests/day • No auth required
                    </span>
                    <a 
                      href="mailto:api@compliancehub.dev?subject=Beta API Access" 
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Beta API Key? Email us →
                    </a>
                  </div>
                </div>
              </details>
            </div>
            
            {/* Main Footer */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                ComplianceHub MVP • Built for DE/EU developers and SMBs
              </div>
              <div className="text-sm text-gray-500">
                v2025-10-06 • EN 16931 v2 & Peppol BIS 4.0
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}