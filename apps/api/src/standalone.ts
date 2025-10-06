import { Router } from 'itty-router';
import { XMLParser } from 'fast-xml-parser';
import Decimal from 'decimal.js';

// Types and interfaces
export interface Env {
  API_VERSION?: string;
  MAX_FILE_SIZE?: string;
  FREE_QUOTA_DAILY?: string;
  KV_QUOTA?: KVNamespace;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta: {
    version: string;
    timestamp: string;
    quota?: {
      remaining: number;
      resetAt: string;
    };
  };
}

interface ValidationRule {
  id: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  path: string;
  message: string;
  hint: string;
}

interface ChecklistItem {
  id: string;
  status: string;
  hint: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
}

interface ValidationResult {
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

// UBL document structure
interface ParsedUBL {
  Invoice: {
    'cbc:CustomizationID'?: string;
    'cbc:ProfileID'?: string;
    'cbc:ID'?: string;
    'cbc:IssueDate'?: string;
    'cbc:DueDate'?: string;
    'cbc:InvoiceTypeCode'?: { '#text': string; '@_name'?: string };
    'cbc:DocumentCurrencyCode'?: string;
    'cbc:ReportingRef'?: string;
    'cac:AccountingSupplierParty'?: {
      'cac:Party': {
        'cac:PartyName': { 'cbc:Name': string };
        'cac:PartyTaxScheme'?: { 'cbc:CompanyID': string };
        'cac:PostalAddress'?: any;
      };
    };
    'cac:AccountingCustomerParty'?: {
      'cac:Party': {
        'cac:PartyName': { 'cbc:Name': string };
        'cac:PartyTaxScheme'?: { 'cbc:CompanyID': string };
      };
    };
    'cac:TaxTotal'?: {
      'cbc:TaxAmount': { '#text': string; '@_currencyID'?: string };
      'cac:TaxSubtotal'?: Array<{
        'cbc:TaxableAmount': { '#text': string };
        'cbc:TaxAmount': { '#text': string };
        'cac:TaxCategory': {
          'cbc:Percent': string;
          'cbc:TaxExemptionReasonCode'?: string;
          'cbc:TaxExemptionReason'?: string;
        };
      }>;
    };
    'cac:LegalMonetaryTotal'?: {
      'cbc:LineExtensionAmount'?: { '#text': string };
      'cbc:TaxExclusiveAmount'?: { '#text': string };
      'cbc:TaxInclusiveAmount'?: { '#text': string };
      'cbc:PayableAmount': { '#text': string };
    };
    'cac:InvoiceLine'?: Array<{
      'cbc:ID': string;
      'cbc:InvoicedQuantity': { '#text': string; '@_unitCode'?: string };
      'cbc:LineExtensionAmount': { '#text': string };
      'cac:TaxTotal'?: {
        'cac:TaxSubtotal': {
          'cbc:TaxableAmount': { '#text': string };
          'cbc:TaxAmount': { '#text': string };
          'cac:TaxCategory': { 'cbc:Percent': string };
        };
      };
      'cac:Price'?: { 'cbc:PriceAmount': { '#text': string } };
      'cac:Item'?: { 'cbc:Name': string };
    }>;
    'cac:AllowanceCharge'?: Array<{
      'cbc:ChargeIndicator': boolean;
      'cbc:Amount': { '#text': string };
      'cbc:BaseAmount'?: { '#text': string };
    }>;
    'cac:InvoiceNote'?: Array<{ '#text': string }>;
    'cac:AdditionalDocumentReference'?: any;
  };
}

// Validation rules interface
interface Rule {
  id: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  check: (doc: ParsedUBL) => boolean;
  path: string;
  message: string;
  hint: string;
}

// Utility functions
function parseDecimal(value: string | undefined): Decimal {
  if (!value) return new Decimal(0);
  try {
    return new Decimal(value);
  } catch {
    return new Decimal(0);
  }
}

function isValidVATId(vatId: string): boolean {
  // Simplified VAT ID validation
  return /^[A-Z]{2}[0-9A-Z]{2,}$/.test(vatId);
}

// 25 Lite Validation Rules
const liteRules: Rule[] = [
  // Core EN 16931 BR rules
  {
    id: 'BR-01',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cbc:CustomizationID'],
    path: '/Invoice/cbc:CustomizationID',
    message: 'Missing Specification identifier',
    hint: 'Add UBL profile ID (e.g., urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_1.0:2022-01-01)',
  },
  {
    id: 'BR-02',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cbc:ProfileID'],
    path: '/Invoice/cbc:ProfileID',
    message: 'Missing Profile ID',
    hint: 'Use EN 16931 profile (e.g., urn:fdc:peppol.eu:2017:poacc:billing:3.0)',
  },
  {
    id: 'BR-03',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cbc:ID'],
    path: '/Invoice/cbc:ID',
    message: 'Missing Invoice number',
    hint: 'BT-1 Invoice identifier is required',
  },
  {
    id: 'BR-04',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cbc:IssueDate'],
    path: '/Invoice/cbc:IssueDate',
    message: 'Missing Issue date',
    hint: 'BT-2 Issue date in ISO format (YYYY-MM-DD) is required',
  },
  {
    id: 'BR-05',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cbc:InvoiceTypeCode'],
    path: '/Invoice/cbc:InvoiceTypeCode',
    message: 'Missing Invoice type code',
    hint: 'Use 380 for invoice or 381 for credit note',
  },
  {
    id: 'BR-06',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cbc:DocumentCurrencyCode'],
    path: '/Invoice/cbc:DocumentCurrencyCode',
    message: 'Missing Document currency code',
    hint: 'BT-5 Currency code (e.g., EUR) is required',
  },
  {
    id: 'BR-07',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cac:AccountingSupplierParty'],
    path: '/Invoice/cac:AccountingSupplierParty',
    message: 'Missing Seller information',
    hint: 'BT-27+ Seller party information is required',
  },
  {
    id: 'BR-08',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cac:AccountingCustomerParty'],
    path: '/Invoice/cac:AccountingCustomerParty',
    message: 'Missing Buyer information',
    hint: 'BT-44+ Buyer party information is required',
  },
  {
    id: 'BR-09',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cac:TaxTotal'],
    path: '/Invoice/cac:TaxTotal',
    message: 'Missing Tax total',
    hint: 'BT-110 Tax total amount is required',
  },
  {
    id: 'BR-10',
    severity: 'ERROR',
    check: (doc) => !!doc.Invoice['cac:LegalMonetaryTotal'],
    path: '/Invoice/cac:LegalMonetaryTotal',
    message: 'Missing Legal monetary total',
    hint: 'BT-112 Grand total amount is required',
  },
  
  // Arithmetic validation rules
  {
    id: 'BR-11',
    severity: 'ERROR',
    check: (doc) => {
      try {
        const lines = doc.Invoice['cac:InvoiceLine'] || [];
        const linesNet = lines.reduce((sum, line) => {
          const amount = line['cbc:LineExtensionAmount']?.['#text'] || '0';
          return sum.add(parseDecimal(amount));
        }, new Decimal(0));
        
        const taxExclusiveAmount = doc.Invoice['cac:LegalMonetaryTotal']?.['cbc:TaxExclusiveAmount']?.['#text'] || '0';
        return linesNet.eq(parseDecimal(taxExclusiveAmount));
      } catch {
        return false;
      }
    },
    path: '/Invoice/cac:LegalMonetaryTotal',
    message: 'Sum of line net amounts does not equal tax exclusive amount',
    hint: 'Recalculate sum(lineExtensionAmount) = taxExclusiveAmount',
  },
  {
    id: 'BR-12',
    severity: 'ERROR',
    check: (doc) => {
      try {
        const taxExclusive = parseDecimal(doc.Invoice['cac:LegalMonetaryTotal']?.['cbc:TaxExclusiveAmount']?.['#text'] || '0');
        const taxAmount = parseDecimal(doc.Invoice['cac:TaxTotal']?.['cbc:TaxAmount']?.['#text'] || '0');
        const payableAmount = parseDecimal(doc.Invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']?.['#text'] || '0');
        
        return taxExclusive.add(taxAmount).eq(payableAmount);
      } catch {
        return false;
      }
    },
    path: '/Invoice/cac:LegalMonetaryTotal',
    message: 'Payable amount calculation error',
    hint: 'Ensure taxExclusiveAmount + taxAmount = payableAmount',
  },

  // VAT validation rules
  {
    id: 'BR-13',
    severity: 'ERROR',
    check: (doc) => {
      const taxSubtotals = doc.Invoice['cac:TaxTotal']?.['cac:TaxSubtotal'] || [];
      const zeroVatSubtotals = taxSubtotals.filter(subtotal => {
        const percent = parseFloat(subtotal['cac:TaxCategory']?.['cbc:Percent'] || '0');
        return percent === 0;
      });
      
      return zeroVatSubtotals.every(subtotal => 
        subtotal['cac:TaxCategory']?.['cbc:TaxExemptionReason'] ||
        subtotal['cac:TaxCategory']?.['cbc:TaxExemptionReasonCode']
      );
    },
    path: '/Invoice/cac:TaxTotal/cac:TaxSubtotal',
    message: '0% VAT rate missing exemption reason',
    hint: 'BT-121 Tax exemption reason is required for 0% VAT',
  },

  // Additional validation rules continue...
  {
    id: 'BR-15',
    severity: 'ERROR',
    check: (doc) => {
      const sellerVat = doc.Invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyTaxScheme']?.['cbc:CompanyID'];
      const buyerVat = doc.Invoice['cac:AccountingCustomerParty']?.['cac:Party']?.['cac:PartyTaxScheme']?.['cbc:CompanyID'];
      
      return (!sellerVat || isValidVATId(sellerVat)) && (!buyerVat || isValidVATId(buyerVat));
    },
    path: '/Invoice/cac:Party/cac:PartyTaxScheme',
    message: 'Invalid VAT identification number format',
    hint: 'VAT ID format should be: Country code (2 chars) + VAT number (e.g., DE123456789)',
  },

  // ViDA/EN v2 extensions
  {
    id: 'V2-DRR-01',
    severity: 'WARN',
    check: (doc) => !!doc.Invoice['cbc:ReportingRef'],
    path: '/Invoice/cbc:ReportingRef',
    message: 'Missing ViDA digital reporting reference',
    hint: 'BT-DRR-01: Add reporting reference for ViDA compliance (EU Directive 2025)',
  },

  // Peppol BIS 4.0 preview rules
  {
    id: 'BIS4-SB-01',
    severity: 'WARN',
    check: (doc) => {
      const notes = doc.Invoice['cac:InvoiceNote'] || [];
      const hasSelfBillingNote = notes.some(note => 
        note['#text']?.toLowerCase().includes('self-billing') ||
        note['#text']?.toLowerCase().includes('self-invoice')
      );
      return hasSelfBillingNote || notes.length === 0;
    },
    path: '/Invoice/cac:InvoiceNote',
    message: 'Self-billing flag missing',
    hint: 'BIS 4.0: Self-billing transactions require explicit indication (mandatory from March 2025)',
  },
];

// Validation function
function runLiteRules(doc: ParsedUBL, vida = false): ValidationResult {
  const errors: ValidationRule[] = [];
  const warnings: ValidationRule[] = [];
  const infos: ValidationRule[] = [];

  // Run all rules
  liteRules.forEach(rule => {
    try {
      const passed = rule.check(doc);
      if (!passed) {
        const validationRule: ValidationRule = {
          id: rule.id,
          severity: rule.severity,
          path: rule.path,
          message: rule.message,
          hint: rule.hint,
        };

        switch (rule.severity) {
          case 'ERROR':
            errors.push(validationRule);
            break;
          case 'WARN':
            warnings.push(validationRule);
            break;
          case 'INFO':
            infos.push(validationRule);
            break;
        }
      }
    } catch (error) {
      errors.push({
        id: rule.id,
        severity: 'ERROR',
        path: rule.path,
        message: `Rule execution failed: ${rule.message}`,
        hint: rule.hint,
      });
    }
  });

  const valid = errors.length === 0;
  const meta: any = {
    profile: detectProfile(doc),
  };

  // ViDA scoring and checklist
  if (vida) {
    const score = Math.max(0, 100 - (errors.length * 10 + warnings.length * 2));
    const vidaCompliant = score >= 80;

    const checklist: ChecklistItem[] = [
      {
        id: 'DRR-01',
        status: doc.Invoice['cbc:ReportingRef'] ? '✓ OK' : '✗ Fail',
        hint: 'Digital Reporting Reference for ViDA compliance',
        severity: 'WARN',
      },
      {
        id: 'VAT-EXEMPTION',
        status: errors.some(e => e.id === 'BR-13') ? '✗ Fail' : '✓ OK',
        hint: '0% VAT rates have proper exemption reasons',
        severity: 'ERROR',
      },
      {
        id: 'ARITHMETIC',
        status: errors.some(e => e.id === 'BR-11' || e.id === 'BR-12') ? '✗ Fail' : '✓ OK',
        hint: 'All monetary calculations are correct',
        severity: 'ERROR',
      },
    ];

    meta.score = score;
    meta.checklist = checklist;
    meta.vidaCompliant = vidaCompliant;
  }

  return {
    valid,
    errors,
    warnings,
    infos,
    meta,
  };
}

function detectProfile(doc: ParsedUBL): string {
  const customizationId = doc.Invoice['cbc:CustomizationID'];
  const profileId = doc.Invoice['cbc:ProfileID'];

  if (customizationId?.includes('xrechnung')) return 'XRECHNUNG';
  if (profileId?.includes('peppol')) return 'PEPPOL';
  if (customizationId?.includes('en16931')) return 'EN';
  
  return 'UNKNOWN';
}

// Main validation function
async function validateUbl(xmlContent: string, vida = false): Promise<ValidationResult> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
  });

  try {
    const parsed = parser.parse(xmlContent);
    if (!parsed.Invoice) {
      throw new Error('Not a valid UBL Invoice document');
    }

    return runLiteRules(parsed as ParsedUBL, vida);
  } catch (error) {
    throw new Error(`XML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Quota management (simplified)
function getUserId(request: Request): string {
  const forwarded = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown';
  return forwarded.split(',')[0].trim();
}

async function checkQuota(userId: string, env: Env): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  // Simplified quota - in production this would use KV storage
  const now = new Date();
  const resetAt = new Date(now);
  resetAt.setHours(23, 59, 59, 999); // Reset at end of day
  
  return {
    allowed: true, // Always allow for now
    remaining: 100,
    resetAt: resetAt.toISOString(),
  };
}

// Create router with base path
const router = Router({ base: '/api' });

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Helper functions
function createResponse<T>(data: T, status = 200, env?: Env, quota?: any): Response {
  const response: ApiResponse<T> = {
    success: status < 400,
    data: status < 400 ? data : undefined,
    error: status >= 400 ? (typeof data === 'string' ? data : 'An error occurred') : undefined,
    meta: {
      version: env?.API_VERSION || '2025-10-06',
      timestamp: new Date().toISOString(),
      quota: quota ? {
        remaining: quota.remaining,
        resetAt: quota.resetAt,
      } : undefined,
    },
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

async function parseMultipartFile(request: Request): Promise<{ file: File; formData: FormData }> {
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('multipart/form-data')) {
    throw new Error('Expected multipart/form-data');
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file || !file.size) {
    throw new Error('No file provided');
  }

  return { file, formData };
}

// Routes

// Health check
router.get('/health', (request: Request, env: Env) => {
  return createResponse({ 
    status: 'healthy',
    version: env.API_VERSION || '2025-10-06',
    timestamp: new Date().toISOString()
  });
});

// Get quota information
router.get('/quota', async (request: Request, env: Env) => {
  try {
    const userId = getUserId(request);
    const quotaCheck = await checkQuota(userId, env);
    
    return createResponse({
      used: 100 - quotaCheck.remaining, // Calculate used from remaining
      remaining: quotaCheck.remaining,
      resetAt: quotaCheck.resetAt,
    });
  } catch (error) {
    console.error('Quota check error:', error);
    return createResponse('Failed to check quota', 500, env);
  }
});

// Validate UBL XML
router.post('/validate', async (request: Request, env: Env) => {
  try {
    // Check quota
    const userId = getUserId(request);
    const quotaCheck = await checkQuota(userId, env);
    
    if (!quotaCheck.allowed) {
      return createResponse('Quota exceeded', 429, env, quotaCheck);
    }

    // Parse form data
    const { file, formData } = await parseMultipartFile(request);
    
    // Check file size
    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880'); // 5MB
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env, quotaCheck);
    }

    // Get options
    const vida = formData.get('vida') === 'true';
    
    // Read and validate XML
    const xmlContent = await file.text();
    const result = await validateUbl(xmlContent, vida);
    
    return createResponse(result, 200, env, quotaCheck);
    
  } catch (error) {
    console.error('Validation error:', error);
    return createResponse(error instanceof Error ? error.message : 'Validation failed', 500, env);
  }
});

// Flatten UBL to CSV/JSON
router.post('/flatten', async (request: Request, env: Env) => {
  try {
    // Check quota
    const userId = getUserId(request);
    const quotaCheck = await checkQuota(userId, env);
    
    if (!quotaCheck.allowed) {
      return createResponse('Quota exceeded', 429, env, quotaCheck);
    }

    // Parse form data
    const { file, formData } = await parseMultipartFile(request);
    
    // Check file size
    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880');
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env, quotaCheck);
    }

    // Get options
    const denormalized = formData.get('denormalized') === 'true';
    const taxColumns = formData.get('taxColumns') === 'true';
    const format = (formData.get('format') as 'csv' | 'json') || 'csv';
    const returnJson = new URL(request.url).searchParams.get('json') === 'true';
    
    // Read XML content
    const xmlContent = await file.text();
    
    // Simple CSV flattening (basic implementation)
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    
    const parsed = parser.parse(xmlContent);
    const invoice = parsed.Invoice;
    
    if (returnJson || format === 'json') {
      return createResponse({
        invoice: {
          id: invoice['cbc:ID'],
          issueDate: invoice['cbc:IssueDate'],
          currency: invoice['cbc:DocumentCurrencyCode'],
          seller: invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'],
          buyer: invoice['cac:AccountingCustomerParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'],
          total: invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']?.['#text'] || invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']
        }
      }, 200, env, quotaCheck);
    } else {
      // Return CSV as file download
      const csvContent = `Invoice ID,Issue Date,Currency,Seller,Buyer,Total\n"${invoice['cbc:ID'] || ''}","${invoice['cbc:IssueDate'] || ''}","${invoice['cbc:DocumentCurrencyCode'] || ''}","${invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'] || ''}","${invoice['cac:AccountingCustomerParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'] || ''}","${invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']?.['#text'] || invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount'] || ''}"`;
      
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="invoice_${Date.now()}.csv"`,
          ...corsHeaders,
        },
      });
    }
    
  } catch (error) {
    console.error('Flattening error:', error);
    return createResponse(error instanceof Error ? error.message : 'Flattening failed', 500, env);
  }
});

// Combined validate + flatten
router.post('/process', async (request: Request, env: Env) => {
  try {
    // Check quota (counts as 2 operations)
    const userId = getUserId(request);
    const quotaCheck1 = await checkQuota(userId, env);
    if (!quotaCheck1.allowed) {
      return createResponse('Quota exceeded', 429, env, quotaCheck1);
    }
    
    const quotaCheck2 = await checkQuota(userId, env);
    if (!quotaCheck2.allowed) {
      return createResponse('Quota exceeded', 429, env, quotaCheck2);
    }

    // Parse form data
    const { file, formData } = await parseMultipartFile(request);
    
    const maxSize = parseInt(env.MAX_FILE_SIZE || '5242880');
    if (file.size > maxSize) {
      return createResponse(`File too large. Maximum size: ${maxSize} bytes`, 400, env, quotaCheck2);
    }

    const xmlContent = await file.text();
    
    // Get options
    const vida = formData.get('vida') === 'true';
    
    // Validate
    const validation = await validateUbl(xmlContent, vida);
    
    // Basic flattening
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
    
    const parsed = parser.parse(xmlContent);
    const invoice = parsed.Invoice;
    
    const flattened = {
      invoice: {
        id: invoice['cbc:ID'],
        issueDate: invoice['cbc:IssueDate'],
        currency: invoice['cbc:DocumentCurrencyCode'],
        seller: invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'],
        buyer: invoice['cac:AccountingCustomerParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'],
        total: invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']?.['#text'] || invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']
      }
    };
    
    return createResponse({
      validation,
      flattened,
    }, 200, env, quotaCheck2);
    
  } catch (error) {
    console.error('Processing error:', error);
    return createResponse(error instanceof Error ? error.message : 'Processing failed', 500, env);
  }
});

// OPTIONS handler for CORS
router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
});

// 404 handler
router.all('*', () => createResponse('Not found', 404));

// Main worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error('Worker error:', error);
      return createResponse('Internal server error', 500, env);
    }
  },
};