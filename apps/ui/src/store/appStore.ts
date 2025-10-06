import { create } from 'zustand';
import { ValidationResult, FlattenResult } from '@compliance-hub/shared';

export interface AppState {
  // Upload state
  isLoading: boolean;
  uploadProgress: number;
  
  // Settings
  vidaMode: boolean;
  denormalized: boolean;
  taxColumns: boolean;
  
  // Results
  validationResult: ValidationResult | null;
  flattenResult: FlattenResult | null;
  
  // Quota
  quota: {
    used: number;
    remaining: number;
    resetAt: string;
  } | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setVidaMode: (enabled: boolean) => void;
  setDenormalized: (enabled: boolean) => void;
  setTaxColumns: (enabled: boolean) => void;
  setValidationResult: (result: ValidationResult | null) => void;
  setFlattenResult: (result: FlattenResult | null) => void;
  setQuota: (quota: AppState['quota']) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  isLoading: false,
  uploadProgress: 0,
  vidaMode: false,
  denormalized: true,
  taxColumns: false,
  validationResult: null,
  flattenResult: null,
  quota: null,
  
  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  
  setVidaMode: (vidaMode) => set({ vidaMode }),
  
  setDenormalized: (denormalized) => set({ denormalized }),
  
  setTaxColumns: (taxColumns) => set({ taxColumns }),
  
  setValidationResult: (validationResult) => set({ validationResult }),
  
  setFlattenResult: (flattenResult) => set({ flattenResult }),
  
  setQuota: (quota) => set({ quota }),
  
  reset: () => set({
    isLoading: false,
    uploadProgress: 0,
    validationResult: null,
    flattenResult: null,
  }),
}));