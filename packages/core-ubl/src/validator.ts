import { XMLParser } from 'fast-xml-parser';
import { ValidationResult, ParseError } from '@compliance-hub/shared';
import { ParsedUBL, runLiteRules } from './rules.js';

// XML Parser configuration
const xmlParserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false,
  alwaysCreateTextNode: false,
};

export class UBLValidator {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser(xmlParserOptions);
  }

  /**
   * Validate UBL XML document
   * @param xml UBL XML string
   * @param vida Enable ViDA mode for scoring and checklist
   * @returns ValidationResult
   */
  async validateUbl(xml: string, vida = false): Promise<ValidationResult> {
    try {
      // Parse XML
      const parsedDoc = this.parseXML(xml);
      
      // Ensure it's a UBL Invoice
      if (!parsedDoc.Invoice) {
        throw new ParseError('Not a valid UBL Invoice document', '/');
      }

      // Run validation rules
      const result = runLiteRules(parsedDoc, vida);

      return result;
    } catch (error) {
      if (error instanceof ParseError) {
        throw error;
      }

      // Handle XML parsing errors
      throw new ParseError(
        `Failed to parse UBL XML: ${error instanceof Error ? error.message : 'Unknown error'}`,
        '/'
      );
    }
  }

  /**
   * Parse XML string to structured document
   */
  private parseXML(xml: string): ParsedUBL {
    try {
      const cleanXml = this.cleanXML(xml);
      const parsed = this.parser.parse(cleanXml);
      
      return this.normalizeDocument(parsed);
    } catch (error) {
      throw new ParseError(
        `XML parsing failed: ${error instanceof Error ? error.message : 'Invalid XML'}`,
        '/'
      );
    }
  }

  /**
   * Clean and prepare XML for parsing
   */
  private cleanXML(xml: string): string {
    // Remove BOM if present
    let cleanXml = xml.replace(/^\uFEFF/, '');
    
    // Ensure XML declaration is present
    if (!cleanXml.trim().startsWith('<?xml')) {
      cleanXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + cleanXml;
    }
    
    return cleanXml;
  }

  /**
   * Normalize parsed document structure for consistent access
   */
  private normalizeDocument(parsed: any): ParsedUBL {
    // Handle different possible root elements
    let invoice = parsed.Invoice || parsed['ubl:Invoice'] || parsed['Invoice'];
    
    if (!invoice) {
      // Try to find Invoice in any namespace
      for (const key of Object.keys(parsed)) {
        if (key.includes('Invoice')) {
          invoice = parsed[key];
          break;
        }
      }
    }

    if (!invoice) {
      throw new ParseError('No Invoice element found in document');
    }

    // Normalize arrays - fast-xml-parser might not always create arrays for repeated elements
    if (invoice['cac:InvoiceLine'] && !Array.isArray(invoice['cac:InvoiceLine'])) {
      invoice['cac:InvoiceLine'] = [invoice['cac:InvoiceLine']];
    }

    if (invoice['cac:TaxTotal']?.['cac:TaxSubtotal'] && !Array.isArray(invoice['cac:TaxTotal']['cac:TaxSubtotal'])) {
      invoice['cac:TaxTotal']['cac:TaxSubtotal'] = [invoice['cac:TaxTotal']['cac:TaxSubtotal']];
    }

    if (invoice['cac:AllowanceCharge'] && !Array.isArray(invoice['cac:AllowanceCharge'])) {
      invoice['cac:AllowanceCharge'] = [invoice['cac:AllowanceCharge']];
    }

    if (invoice['cac:InvoiceNote'] && !Array.isArray(invoice['cac:InvoiceNote'])) {
      invoice['cac:InvoiceNote'] = [invoice['cac:InvoiceNote']];
    }

    return { Invoice: invoice };
  }

  /**
   * Extract basic invoice information for quick inspection
   */
  extractBasicInfo(xml: string): {
    invoiceId?: string;
    issueDate?: string;
    currency?: string;
    totalAmount?: string;
    profile?: string;
  } {
    try {
      const doc = this.parseXML(xml);
      const invoice = doc.Invoice;

      return {
        invoiceId: invoice['cbc:ID'],
        issueDate: invoice['cbc:IssueDate'],
        currency: invoice['cbc:DocumentCurrencyCode'],
        totalAmount: invoice['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']?.['#text'],
        profile: invoice['cbc:ProfileID'],
      };
    } catch {
      return {};
    }
  }
}

// Export singleton instance
export const ublValidator = new UBLValidator();

// Export main validation function for easy usage
export async function validateUbl(xml: string, vida = false): Promise<ValidationResult> {
  return ublValidator.validateUbl(xml, vida);
}