import { z } from 'zod';
import Decimal from 'decimal.js';

// UBL Document Types
export const UblHeader = z.object({
  invoiceId: z.string().min(1, 'BT-1 Invoice number required'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'BT-2 ISO date required'),
  dueDate: z.string().optional(),
  currency: z.string().length(3, 'BT-5 Currency code').default('EUR'),
  profile: z.enum(['EN', 'PEPPOL', 'XRECHNUNG']),
  customizationId: z.string().optional(),
  profileId: z.string().optional(),
  typeCode: z.string().default('380'), // 380=invoice, 381=credit note
  seller: z.object({
    name: z.string().min(1, 'BT-27 Seller name required'),
    vatId: z.string().optional().refine(
      (val) => !val || /^[A-Z]{2}[\w\d]{2,12}$/.test(val),
      'Invalid VAT ID format'
    ),
    street: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }),
  buyer: z.object({
    name: z.string().min(1, 'BT-44 Buyer name required'),
    vatId: z.string().optional().refine(
      (val) => !val || /^[A-Z]{2}[\w\d]{2,12}$/.test(val),
      'Invalid VAT ID format'
    ),
    street: z.string().optional(),
    city: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }),
  totals: z.object({
    taxable: z.string().transform((v) => new Decimal(v)),
    tax: z.string().transform((v) => new Decimal(v)),
    grand: z.string().transform((v) => new Decimal(v)),
    payable: z.string().transform((v) => new Decimal(v)),
  }),
  taxes: z.array(z.object({
    rate: z.number().min(0).max(100),
    taxable: z.string().transform((v) => new Decimal(v)),
    amount: z.string().transform((v) => new Decimal(v)),
    exemptionCode: z.string().optional(),
    exemptionReason: z.string().optional(), // Required for 0% VAT in v2
    category: z.string().optional(),
  })),
  refs: z.object({
    orderRef: z.string().optional(),
    contractRef: z.string().optional(),
    projectRef: z.string().optional(), // ViDA DRR prep
    reportingRef: z.string().optional(), // BT-DRR-01 for ViDA
  }).partial(),
  vidaCompliant: z.boolean().optional(),
});

export const UblLine = z.object({
  lineNo: z.string().min(1, 'BT-126 Line ID required'),
  itemName: z.string().max(200).optional(), // BT-153
  itemSku: z.string().optional(),
  qty: z.coerce.number().positive('BT-129 Quantity must be positive'),
  unit: z.string().optional(),
  unitPrice: z.string().transform((v) => new Decimal(v)),
  priceBaseQty: z.string().optional().transform((v) => v ? new Decimal(v) : new Decimal(1)),
  lineNet: z.string().transform((v) => new Decimal(v)), // BT-131
  vatRate: z.number().min(0).max(100),
  vatCategory: z.string().optional(), // BT-151
  vatAmount: z.string().optional().transform((v) => v ? new Decimal(v) : new Decimal(0)),
  lineAllowance: z.string().optional().transform((v) => v ? new Decimal(v) : new Decimal(0)),
  lineCharge: z.string().optional().transform((v) => v ? new Decimal(v) : new Decimal(0)),
  poLineRef: z.string().optional(),
  costCenter: z.string().optional(),
  projectCode: z.string().optional(), // EN v2 extension
});

export type UblHeader = z.infer<typeof UblHeader>;
export type UblLine = z.infer<typeof UblLine>;

// Validation Results
export interface ValidationRule {
  id: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  path: string;
  message: string;
  hint: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  infos: ValidationRule[];
  meta: {
    profile?: string;
    score?: number;
    checklist?: ChecklistItem[];
    vidaCompliant?: boolean;
  };
}

export interface ChecklistItem {
  id: string;
  status: '✓ OK' | '✗ Fail' | '? Unknown';
  hint: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
}

// Flattening Options
export interface FlattenOptions {
  denormalized?: boolean; // Repeat header in each row
  taxColumns?: boolean;   // Pivot tax rates as columns
  format?: 'csv' | 'json';
}

export interface FlattenResult {
  csv?: string;
  json?: {
    header: UblHeader;
    lines: UblLine[];
  };
  meta: {
    lineCount: number;
    currency: string;
  };
}

// API Request/Response Types
export interface ValidateRequest {
  xml: string;
  vida?: boolean;
}

export interface FlattenRequest {
  xml: string;
  options?: FlattenOptions;
}

// Error Types
export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ParseError extends Error {
  constructor(
    message: string,
    public xmlPath?: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}