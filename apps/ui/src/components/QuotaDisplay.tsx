import React from 'react';
import { Clock, Zap } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';

export function QuotaDisplay() {
  const { quota } = useAppStore();

  if (!quota) {
    return null;
  }

  const usagePercentage = quota.remaining <= 0 ? 100 : ((100 - quota.remaining) / 100) * 100;
  const resetDate = new Date(quota.resetAt);
  const timeUntilReset = resetDate.getTime() - Date.now();
  const hoursUntilReset = Math.max(0, Math.ceil(timeUntilReset / (1000 * 60 * 60)));

  const getUsageColor = () => {
    if (quota.remaining <= 5) return 'bg-error-500';
    if (quota.remaining <= 20) return 'bg-warning-500';
    return 'bg-success-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-gray-900">API Quota</span>
        </div>
        <span className="text-sm text-gray-600">
          {quota.remaining} remaining
        </span>
      </div>
      
      {/* Usage Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getUsageColor()}`}
          style={{ width: `${Math.min(100, usagePercentage)}%` }}
        />
      </div>
      
      {/* Reset Time */}
      <div className="flex items-center space-x-1 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>
          Resets in {hoursUntilReset}h
        </span>
      </div>
      
      {quota.remaining <= 5 && (
        <div className="mt-2 p-2 bg-warning-50 border border-warning-200 rounded text-xs text-warning-700">
          ⚠️ Low quota remaining. Consider upgrading for unlimited usage.
        </div>
      )}
    </div>
  );
}