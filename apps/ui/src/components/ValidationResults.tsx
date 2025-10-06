import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Award, Download } from 'lucide-react';
import { ValidationResult } from '@compliance-hub/shared';

interface ValidationResultsProps {
  result: ValidationResult;
  onDownloadCSV?: () => void;
  onDownloadJSON?: () => void;
}

export function ValidationResults({ result, onDownloadCSV, onDownloadJSON }: ValidationResultsProps) {
  const { valid, errors, warnings, infos, meta } = result;
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-error-500" />;
      case 'WARN':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-primary-500" />;
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR':
        return 'text-error-600 bg-error-50 border-error-200';
      case 'WARN':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'INFO':
        return 'text-primary-600 bg-primary-50 border-primary-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className={`p-4 rounded-lg border-2 ${valid ? 'bg-success-50 border-success-200' : 'bg-error-50 border-error-200'}`}>
        <div className="flex items-center space-x-3">
          {valid ? (
            <CheckCircle className="h-6 w-6 text-success-500" />
          ) : (
            <XCircle className="h-6 w-6 text-error-500" />
          )}
          <div>
            <h3 className={`text-lg font-semibold ${valid ? 'text-success-700' : 'text-error-700'}`}>
              {valid ? 'Valid UBL Document' : 'Validation Failed'}
            </h3>
            <p className={`text-sm ${valid ? 'text-success-600' : 'text-error-600'}`}>
              Profile: {meta.profile} | {errors.length} errors, {warnings.length} warnings, {infos.length} infos
            </p>
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
                <div className="text-sm text-success-600 font-medium">✓ ViDA Aligned</div>
              )}
            </div>
          </div>

          {/* Score Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  meta.score >= 80 ? 'bg-success-500' : meta.score >= 60 ? 'bg-warning-500' : 'bg-error-500'
                }`}
                style={{ width: `${meta.score}%` }}
              />
            </div>
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
                    <CheckCircle className="h-4 w-4 text-success-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-error-500" />
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
                      <span className="font-medium text-error-700">{error.id}</span>
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
                      <span className="font-medium text-warning-700">{warning.id}</span>
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
                      <span className="font-medium text-primary-700">{info.id}</span>
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

      {/* Download Actions */}
      {valid && (onDownloadCSV || onDownloadJSON) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Download Flattened Data</h3>
          <div className="flex space-x-3">
            {onDownloadCSV && (
              <button
                onClick={onDownloadCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download CSV</span>
              </button>
            )}
            {onDownloadJSON && (
              <button
                onClick={onDownloadJSON}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download JSON</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}