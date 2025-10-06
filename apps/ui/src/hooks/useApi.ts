import { useState } from 'react';
import { ValidationResult, FlattenResult } from '@compliance-hub/shared';
import { useAppStore } from '../store/appStore.js';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    version: string;
    timestamp: string;
    quota?: {
      remaining: number;
      resetAt: string;
    };
  };
}

// Force rebuild - API endpoints fixed
const API_BASE = 'https://compliancehub-api.heizungsrechner.workers.dev';

export function useApi() {
  const [error, setError] = useState<string | null>(null);
  const { setQuota, setLoading, setUploadProgress } = useAppStore();

  const handleApiResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Quota exceeded. Please try again later.');
      }
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();
    
    // Update quota if provided
    if (data.meta?.quota) {
      setQuota({
        used: 0, // We don't get used count in response
        remaining: data.meta.quota.remaining,
        resetAt: data.meta.quota.resetAt,
      });
    }

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data.data as T;
  };

  const validateFile = async (file: File, vida: boolean = false): Promise<ValidationResult> => {
    setError(null);
    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (vida) formData.append('vida', 'true');

      // Simulate upload progress
      setUploadProgress(30);

      const response = await fetch(`${API_BASE}/api/validate`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);
      
      const result = await handleApiResponse<ValidationResult>(response);
      setUploadProgress(100);
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Validation failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const flattenFile = async (
    file: File, 
    options: {
      denormalized?: boolean;
      taxColumns?: boolean;
      format?: 'csv' | 'json';
    } = {}
  ): Promise<FlattenResult | Blob> => {
    setError(null);
    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.denormalized) formData.append('denormalized', 'true');
      if (options.taxColumns) formData.append('taxColumns', 'true');
      if (options.format) formData.append('format', options.format);

      setUploadProgress(30);

      const url = options.format === 'csv' 
        ? `${API_BASE}/api/flatten` 
        : `${API_BASE}/api/flatten?json=true`;

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      if (options.format === 'csv') {
        // Return CSV as blob for download
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        setUploadProgress(100);
        return await response.blob();
      } else {
        // Return JSON data
        const result = await handleApiResponse<FlattenResult>(response);
        setUploadProgress(100);
        return result;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Flattening failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const processFile = async (
    file: File,
    options: {
      vida?: boolean;
      denormalized?: boolean;
      taxColumns?: boolean;
    } = {}
  ): Promise<{ validation: ValidationResult; flattened: FlattenResult }> => {
    setError(null);
    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.vida) formData.append('vida', 'true');
      if (options.denormalized) formData.append('denormalized', 'true');
      if (options.taxColumns) formData.append('taxColumns', 'true');

      setUploadProgress(30);

      const response = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);
      
      const result = await handleApiResponse<{ validation: ValidationResult; flattened: FlattenResult }>(response);
      setUploadProgress(100);
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const getQuota = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/quota`);
      const result = await handleApiResponse<{
        used: number;
        remaining: number;
        resetAt: string;
      }>(response);
      
      setQuota(result);
      return result;
    } catch (err) {
      console.warn('Failed to fetch quota:', err);
      return null;
    }
  };

  return {
    error,
    validateFile,
    flattenFile,
    processFile,
    getQuota,
    clearError: () => setError(null),
  };
}