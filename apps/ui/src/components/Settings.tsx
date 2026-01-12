import React from 'react';
import { Settings as SettingsIcon, Info } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';

export function Settings() {
  const {
    vidaMode,
    denormalized,
    taxColumns,
    setVidaMode,
    setDenormalized,
    setTaxColumns,
  } = useAppStore();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <SettingsIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Validation Settings</h3>
      </div>
      
      <div className="space-y-4">
        {/* ViDA Mode */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="vida-mode"
            checked={vidaMode}
            onChange={(e) => setVidaMode(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <div className="flex-1">
            <label htmlFor="vida-mode" className="text-sm font-medium text-gray-900 cursor-pointer">
              ViDA Compliance Mode
            </label>
            <p className="text-xs text-gray-600 mt-1">
              Enable ViDA scoring and checklist for EU Digital Reporting Requirements
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Flattening Options</h4>
          
          {/* Denormalized */}
          <div className="flex items-start space-x-3 mb-3">
            <input
              type="checkbox"
              id="denormalized"
              checked={denormalized}
              onChange={(e) => setDenormalized(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="denormalized" className="text-sm font-medium text-gray-900 cursor-pointer">
                Denormalized Output
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Repeat invoice header information in each line for easier analysis
              </p>
            </div>
          </div>

          {/* Tax Columns */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="tax-columns"
              checked={taxColumns}
              onChange={(e) => setTaxColumns(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="tax-columns" className="text-sm font-medium text-gray-900 cursor-pointer">
                Tax Rate Columns
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Add separate columns for each VAT rate (e.g., vat_19_base, vat_19_amount)
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary-50 border border-primary-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-primary-600 mt-0.5" />
            <div className="text-xs text-primary-700">
              <p className="font-medium">About ViDA Mode:</p>
              <p className="mt-1">
                ViDA (ViDA in the EU) compliance mode validates against EN 16931 v2 
                requirements and Peppol BIS 4.0 preview standards. Score ≥80 indicates ViDA alignment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}