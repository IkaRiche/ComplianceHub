import { ValidationRule, ChecklistItem } from '@compliance-hub/shared';
import { parseDecimal, sumDecimals, isValidVATId } from '@compliance-hub/shared';
import Decimal from 'decimal.js';

// Parsed UBL document structure (from fast-xml-parser)
export interface ParsedUBL {
  Invoice: {
    'cbc:CustomizationID'?: string;
    'cbc:ProfileID'?: string;
    'cbc:ID'?: string;
    'cbc:IssueDate'?: string;
    'cbc:DueDate'?: string;
    'cbc:InvoiceTypeCode'?: { '#text': string; '@_name'?: string };
    'cbc:DocumentCurrencyCode'?: string;
    'cbc:ReportingRef'?: string; // ViDA DRR ref
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
    'cac:InvoiceNote'?: Array<{ '#text': string }>; // For BIS4 self-billing flag
  };
}

export interface Rule {
  id: string;
  severity: 'ERROR' | 'WARN' | 'INFO';
  check: (doc: ParsedUBL) => boolean;
  path: string;
  message: string;
  hint: string;
}

// 25 Lite Rules: Core EN 16931 BR rules + ViDA/BIS 4.0 extensions
export const liteRules: Rule[] = [
  // Core EN 16931 BR rules (BR-01 to BR-10)
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
  
  // Arithmetic validation rules (BR-11 to BR-12)
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

  // VAT validation rules (BR-13 to BR-15)
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
  {
    id: 'BR-14',
    severity: 'WARN',
    check: (doc) => {
      // Simplified reverse charge check
      const sellerVat = doc.Invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyTaxScheme']?.['cbc:CompanyID'];
      const buyerVat = doc.Invoice['cac:AccountingCustomerParty']?.['cac:Party']?.['cac:PartyTaxScheme']?.['cbc:CompanyID'];
      
      if (sellerVat && buyerVat) {
        const sellerCountry = sellerVat.substring(0, 2);
        const buyerCountry = buyerVat.substring(0, 2);
        
        if (sellerCountry !== buyerCountry) {
          const taxSubtotals = doc.Invoice['cac:TaxTotal']?.['cac:TaxSubtotal'] || [];
          const hasZeroVat = taxSubtotals.some(subtotal => {
            const percent = parseFloat(subtotal['cac:TaxCategory']?.['cbc:Percent'] || '0');
            return percent === 0;
          });
          return hasZeroVat; // Cross-border should typically have 0% VAT
        }
      }
      return true; // Pass if can't determine
    },
    path: '/Invoice/cac:TaxTotal',
    message: 'Potential reverse charge scenario not properly handled',
    hint: 'Cross-border B2B transactions typically require 0% VAT with exemption reason',
  },
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

  // Additional EN 16931 rules (BR-16 to BR-20)
  {
    id: 'BR-16',
    severity: 'WARN',
    check: (doc) => {
      const lines = doc.Invoice['cac:InvoiceLine'] || [];
      return lines.every(line => !!line['cbc:ID']);
    },
    path: '/Invoice/cac:InvoiceLine',
    message: 'Invoice line missing identifier',
    hint: 'BT-126 Invoice line identifier is recommended',
  },
  {
    id: 'BR-17',
    severity: 'INFO',
    check: (doc) => !!doc.Invoice['cbc:DueDate'],
    path: '/Invoice/cbc:DueDate',
    message: 'Due date not specified',
    hint: 'BT-9 Payment due date is recommended for payment processing',
  },
  {
    id: 'BR-18',
    severity: 'WARN',
    check: (doc) => {
      const lines = doc.Invoice['cac:InvoiceLine'] || [];
      return lines.every(line => {
        const qty = parseFloat(line['cbc:InvoicedQuantity']?.['#text'] || '0');
        return qty > 0;
      });
    },
    path: '/Invoice/cac:InvoiceLine/cbc:InvoicedQuantity',
    message: 'Invalid line quantity',
    hint: 'BT-129 Invoiced quantity must be positive',
  },
  {
    id: 'BR-19',
    severity: 'ERROR',
    check: (doc) => {
      const allowanceCharges = doc.Invoice['cac:AllowanceCharge'] || [];
      return allowanceCharges.every(ac => {
        const amount = parseFloat(ac['cbc:Amount']?.['#text'] || '0');
        return amount >= 0;
      });
    },
    path: '/Invoice/cac:AllowanceCharge',
    message: 'Allowance/Charge amount cannot be negative',
    hint: 'Use ChargeIndicator to specify allowance (false) or charge (true)',
  },
  {
    id: 'BR-20',
    severity: 'WARN',
    check: (doc) => {
      const currency = doc.Invoice['cbc:DocumentCurrencyCode'];
      if (currency && currency !== 'EUR') {
        // For non-EUR currencies, check if exchange rate info is provided
        // This is a simplified check
        return true; // Allow for now
      }
      return true;
    },
    path: '/Invoice/cbc:DocumentCurrencyCode',
    message: 'Non-EUR currency detected',
    hint: 'Consider providing exchange rate information for non-EUR transactions',
  },

  // ViDA/EN v2 extensions (V2-DRR-01, V2-RC-01, V2-SEC-01)
  {
    id: 'V2-DRR-01',
    severity: 'WARN',
    check: (doc) => !!doc.Invoice['cbc:ReportingRef'],
    path: '/Invoice/cbc:ReportingRef',
    message: 'Missing ViDA digital reporting reference',
    hint: 'BT-DRR-01: Add reporting reference for ViDA compliance (EU Directive 2025)',
  },
  {
    id: 'V2-RC-01',
    severity: 'INFO',
    check: (doc) => {
      // Enhanced reverse charge validation for v2
      const taxSubtotals = doc.Invoice['cac:TaxTotal']?.['cac:TaxSubtotal'] || [];
      const hasReverseChargeCategory = taxSubtotals.some(subtotal => {
        const exemptionCode = subtotal['cac:TaxCategory']?.['cbc:TaxExemptionReasonCode'];
        return exemptionCode === 'AE'; // Reverse charge
      });
      return hasReverseChargeCategory || taxSubtotals.length === 0;
    },
    path: '/Invoice/cac:TaxTotal/cac:TaxSubtotal',
    message: 'Enhanced reverse charge validation',
    hint: 'v2: Ensure proper tax category codes for cross-border transactions',
  },
  {
    id: 'V2-SEC-01',
    severity: 'INFO',
    check: (doc) => true, // Digital signature check would require additional parsing
    path: '/Invoice',
    message: 'Digital signature not detected',
    hint: 'ViDA recommends XAdES digital signatures for enhanced security',
  },

  // Peppol BIS 4.0 preview rules (BIS4-SB-01, BIS4-PINT-01)
  {
    id: 'BIS4-SB-01',
    severity: 'WARN',
    check: (doc) => {
      // Check for self-billing indicator in invoice notes or specific elements
      const notes = doc.Invoice['cac:InvoiceNote'] || [];
      const hasSelfBillingNote = notes.some(note => 
        note['#text']?.toLowerCase().includes('self-billing') ||
        note['#text']?.toLowerCase().includes('self-invoice')
      );
      return hasSelfBillingNote || notes.length === 0; // Pass if no notes or has self-billing note
    },
    path: '/Invoice/cac:InvoiceNote',
    message: 'Self-billing flag missing',
    hint: 'BIS 4.0: Self-billing transactions require explicit indication (mandatory from March 2025)',
  },
  {
    id: 'BIS4-PINT-01',
    severity: 'INFO',
    check: (doc) => !!doc.Invoice['cac:AdditionalDocumentReference'],
    path: '/Invoice/cac:AdditionalDocumentReference',
    message: 'Additional document references not provided',
    hint: 'BIS 4.0 preview: Enhanced document linking capabilities available',
  },
];

export function runLiteRules(doc: ParsedUBL, vida = false): {
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
} {
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
      // If rule execution fails, treat as error
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
      {
        id: 'REVERSE-CHARGE',
        status: warnings.some(w => w.id === 'BR-14') ? '✗ Fail' : '✓ OK',
        hint: 'Cross-border reverse charge handling',
        severity: 'WARN',
      },
      {
        id: 'SELF-BILLING',
        status: warnings.some(w => w.id === 'BIS4-SB-01') ? '✗ Fail' : '✓ OK',
        hint: 'Self-billing scenarios properly flagged',
        severity: 'WARN',
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