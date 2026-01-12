import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadDropzone({ onFileSelect, disabled = false }: UploadDropzoneProps) {
  const { isLoading, uploadProgress } = useAppStore();

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !disabled) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect, disabled]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.xml'],
      'application/xml': ['.xml'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: disabled || isLoading,
    onDropRejected: (rejectedFiles) => {
      // Enhanced error messages for better UX
      rejectedFiles.forEach(rejection => {
        const errors = rejection.errors.map(err => {
          switch (err.code) {
            case 'file-invalid-type':
              return 'Please upload XML files only (UBL Invoice, XRechnung, Peppol BIS)';
            case 'file-too-large':
              return 'File too large. Maximum size is 5MB';
            case 'too-many-files':
              return 'Please upload one file at a time';
            default:
              return err.message;
          }
        });
        console.warn('File rejected:', rejection.file.name, errors);
      });
    },
  });

  const hasRejections = fileRejections.length > 0;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }
          ${disabled || isLoading
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
          }
          ${hasRejections ? 'border-error-500 bg-error-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              <p className="text-sm text-gray-600">Processing...</p>
              {uploadProgress > 0 && (
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex space-x-2">
                <Upload className={`h-8 w-8 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
                <FileText className={`h-8 w-8 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop your UBL file here' : 'Upload UBL XML Invoice'}
                </h3>
                <p className="text-sm text-gray-600">
                  Drag and drop your XML file here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Supports: UBL Invoice, XRechnung, Peppol BIS (max 5MB)
                </p>
              </div>
            </>
          )}
        </div>
        
        {hasRejections && (
          <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-error-500" />
              <div className="text-sm text-error-700">
                <strong>Upload Error:</strong>
                {fileRejections.map(({ file, errors }) => (
                  <div key={file.name} className="mt-1">
                    <span className="font-medium">{file.name}</span>: {
                      errors.map(err => {
                        switch (err.code) {
                          case 'file-invalid-type':
                            return 'Please upload XML files only (UBL Invoice, XRechnung, Peppol BIS)';
                          case 'file-too-large':
                            return 'File too large. Maximum size is 5MB';
                          case 'too-many-files':
                            return 'Please upload one file at a time';
                          default:
                            return err.message;
                        }
                      }).join(', ')
                    }
                  </div>
                ))}
                <div className="mt-2 text-xs text-error-600">
                  💡 Tip: UBL XML invoices typically contain &lt;Invoice&gt; tags and are used for EN 16931 compliance.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}