import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Award, Download, FileText, Lock, ExternalLink } from 'lucide-react';
import { ValidationResult } from '@compliance-hub/shared';

// URLs for upgrade
const PRICING_URL = 'https://vida.bauklar.com/pricing';
const REPORT_PAYMENT_URL = 'https://buy.stripe.com/00w00jefu8Gje7Q0bvfQI00?source=validator_ui';

interface ValidationResultsProps {
  result: ValidationResult;
  onDownloadCSV?: () => void;
  onDownloadJSON?: () => void;
  onDownloadPDF?: () => void;
  userTier?: 'free' | 'starter' | 'growth' | 'scale';
}

export function ValidationResults({
  result,
  onDownloadCSV,
  onDownloadJSON,
  onDownloadPDF,
  userTier = 'free'
}: ValidationResultsProps) {
  const { valid, errors, warnings, infos, meta } = result;
  const isFreeTier = userTier === 'free';

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'WARN':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'INFO':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-4 rounded-lg border-2 ${valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center space-x-3">
          {valid ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500" />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${valid ? 'text-green-700' : 'text-red-700'}`}>
              {valid ? 'Valid UBL Document' : 'Validation Failed'}
            </h3>
            <p className={`text-sm ${valid ? 'text-green-600' : 'text-red-600'}`}>
              Profile: <span className="font-mono font-medium">{meta.profile || 'UNKNOWN'}</span> | {errors.length} errors, {warnings.length} warnings, {infos.length} infos
            </p>
            {meta.profile && meta.profile !== 'UNKNOWN' && (
              <p className="text-xs text-gray-500 mt-1">
                Detected based on CustomizationID/ProfileID in UBL header
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ViDA Score (if enabled) */}
      {meta.score !== undefined && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Award className="h-6 w-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">ViDA Compliance Score</h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{meta.score}/100</div>
              {meta.vidaCompliant && (
                <div className="text-sm text-green-600 font-medium">✓ ViDA Aligned</div>
              )}
            </div>
          </div>

          {/* Score Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${meta.score >= 80 ? 'bg-green-500' : meta.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                style={{ width: `${meta.score}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span className="text-center">ViDA Aligned: ≥80 points</span>
              <span>100</span>
            </div>
          </div>

          {/* Score Explanation */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              <strong>Score based on:</strong> EN 16931 validation rules (70%) + ViDA digital reporting requirements (30%).
              Score ≥80 indicates readiness for EU ViDA compliance.
            </p>
          </div>

          {/* Checklist */}
          {meta.checklist && meta.checklist.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 mb-2">ViDA Checklist</h4>
              {meta.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center space-x-3 p-2 rounded border ${getSeverityColor(item.severity)}`}
                >
                  {item.status === '✓ OK' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div className="flex-1">
                    <span className="font-medium">{item.status}</span>
                    <span className="text-sm ml-2">{item.hint}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Issues */}
      {(errors.length > 0 || warnings.length > 0 || infos.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Validation Issues</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Errors */}
            {errors.map((error, index) => (
              <div key={`error-${index}`} className="p-4">
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(error.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-red-700">{error.id}</span>
                      <span className="text-xs text-gray-500">{error.path}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1">{error.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{error.hint}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Warnings */}
            {warnings.map((warning, index) => (
              <div key={`warning-${index}`} className="p-4">
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(warning.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-amber-700">{warning.id}</span>
                      <span className="text-xs text-gray-500">{warning.path}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1">{warning.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{warning.hint}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Infos */}
            {infos.map((info, index) => (
              <div key={`info-${index}`} className="p-4">
                <div className="flex items-start space-x-3">
                  {getSeverityIcon(info.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-blue-700">{info.id}</span>
                      <span className="text-xs text-gray-500">{info.path}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1">{info.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{info.hint}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Results */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Results</h3>

        {/* Paywall notice for free tier */}
        {isFreeTier && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Upgrade to access CSV/JSON exports and official compliance reports
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {/* Official PDF Report - €99 for free tier, included for paid */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            {userTier === 'free' && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center sm:text-right">
                Official Independent ViDA / EN 16931 Technical Audit (PDF)<br />
                <span className="text-xs">Audit-grade compliance document with scope, methodology, and risk assessment.</span>
              </div>
            )}

            <button
              onClick={onDownloadPDF}
              className={`flex items-center px-6 py-2.5 rounded-lg transition-colors ${userTier === 'free'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              <FileText className="h-5 w-5 mr-2" />
              {userTier === 'free' ? 'Get Official Audit Report (€99)' : 'Download Audit Report'}
            </button>
          </div>

          {/* CSV - Upgrade required for free tier */}
          {onDownloadCSV && (
            <button
              onClick={onDownloadCSV}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${isFreeTier
                ? 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
              {isFreeTier ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              <span>{isFreeTier ? 'CSV (Upgrade)' : 'CSV Data'}</span>
            </button>
          )}

          {/* JSON - Upgrade required for free tier */}
          {onDownloadJSON && (
            <button
              onClick={onDownloadJSON}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${isFreeTier
                ? 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {isFreeTier ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              <span>{isFreeTier ? 'JSON (Upgrade)' : 'JSON Data'}</span>
            </button>
          )}
        </div>

        <div className="mt-3 text-xs text-gray-600 space-y-1">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <FileText className="h-3 w-3 text-red-600" />
              <span>PDF: Official compliance reports for audits</span>
            </span>
          </div>
          {!isFreeTier && (
            <>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Download className="h-3 w-3 text-green-600" />
                  <span>CSV: Excel analysis & BI integration</span>
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1">
                  <Download className="h-3 w-3 text-blue-600" />
                  <span>JSON: API integration & automation</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Upgrade CTA for free tier */}
        {isFreeTier && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <a
              href={PRICING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View pricing & upgrade options
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}