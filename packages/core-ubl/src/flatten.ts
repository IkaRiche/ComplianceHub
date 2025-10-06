import { parse } from 'papaparse';
import { FlattenOptions, FlattenResult, UblHeader, UblLine } from '@compliance-hub/shared';
import { parseDecimal, formatDecimal } from '@compliance-hub/shared';
import { ParsedUBL } from './rules.js';
import { XMLParser } from 'fast-xml-parser';

export class UBLFlattener {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      trimValues: true,
    });
  }

  /**
   * Flatten UBL XML to CSV/JSON format
   */
  async flattenUbl(xml: string, options: FlattenOptions = {}): Promise<FlattenResult> {
    const {
      denormalized = true,
      taxColumns = false,
      format = 'csv'
    } = options;

    try {
      // Parse XML
      const doc = this.parseXML(xml);
      
      // Extract header and lines
      const header = this.extractHeader(doc);
      const lines = this.extractLines(doc);

      // Create flattened data
      const flatData = this.createFlattenedData(header, lines, { denormalized, taxColumns });

      const result: FlattenResult = {
        meta: {
          lineCount: lines.length,
          currency: header.currency,
        }
      };

      if (format === 'csv' || format === undefined) {
        result.csv = this.generateCSV(flatData);
      }

      if (format === 'json') {
        result.json = { header, lines };
      }

      return result;
    } catch (error) {
      throw new Error(`Flattening failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseXML(xml: string): ParsedUBL {
    const cleanXml = xml.replace(/^\uFEFF/, '');
    const parsed = this.parser.parse(cleanXml);
    
    let invoice = parsed.Invoice || parsed['ubl:Invoice'];
    if (!invoice) {
      throw new Error('No Invoice element found');
    }

    // Normalize arrays
    if (invoice['cac:InvoiceLine'] && !Array.isArray(invoice['cac:InvoiceLine'])) {
      invoice['cac:InvoiceLine'] = [invoice['cac:InvoiceLine']];
    }

    return { Invoice: invoice };
  }

  private extractHeader(doc: ParsedUBL): UblHeader {
    const invoice = doc.Invoice;
    
    const supplier = invoice['cac:AccountingSupplierParty']?.['cac:Party'];
    const customer = invoice['cac:AccountingCustomerParty']?.['cac:Party'];
    const taxTotal = invoice['cac:TaxTotal'];
    const monetaryTotal = invoice['cac:LegalMonetaryTotal'];

    // Extract tax information
    const taxes = [];
    if (taxTotal?.['cac:TaxSubtotal']) {
      const taxSubtotals = Array.isArray(taxTotal['cac:TaxSubtotal']) 
        ? taxTotal['cac:TaxSubtotal'] 
        : [taxTotal['cac:TaxSubtotal']];

      for (const subtotal of taxSubtotals) {
        taxes.push({
          rate: parseFloat(subtotal['cac:TaxCategory']?.['cbc:Percent'] || '0'),
          taxable: subtotal['cbc:TaxableAmount']?.['#text'] || '0',
          amount: subtotal['cbc:TaxAmount']?.['#text'] || '0',
          exemptionCode: subtotal['cac:TaxCategory']?.['cbc:TaxExemptionReasonCode'],
          exemptionReason: subtotal['cac:TaxCategory']?.['cbc:TaxExemptionReason'],
          category: subtotal['cac:TaxCategory']?.['cbc:ID'],
        });
      }
    }

    const header: UblHeader = {
      invoiceId: invoice['cbc:ID'] || '',
      issueDate: invoice['cbc:IssueDate'] || '',
      dueDate: invoice['cbc:DueDate'],
      currency: invoice['cbc:DocumentCurrencyCode'] || 'EUR',
      profile: this.detectProfile(invoice),
      customizationId: invoice['cbc:CustomizationID'],
      profileId: invoice['cbc:ProfileID'],
      typeCode: invoice['cbc:InvoiceTypeCode']?.['#text'] || invoice['cbc:InvoiceTypeCode'] || '380',
      seller: {
        name: supplier?.['cac:PartyName']?.['cbc:Name'] || '',
        vatId: supplier?.['cac:PartyTaxScheme']?.['cbc:CompanyID'],
        street: supplier?.['cac:PostalAddress']?.['cbc:StreetName'],
        city: supplier?.['cac:PostalAddress']?.['cbc:CityName'],
        zip: supplier?.['cac:PostalAddress']?.['cbc:PostalZone'],
        country: supplier?.['cac:PostalAddress']?.['cac:Country']?.['cbc:IdentificationCode'],
      },
      buyer: {
        name: customer?.['cac:PartyName']?.['cbc:Name'] || '',
        vatId: customer?.['cac:PartyTaxScheme']?.['cbc:CompanyID'],
        street: customer?.['cac:PostalAddress']?.['cbc:StreetName'],
        city: customer?.['cac:PostalAddress']?.['cbc:CityName'],
        zip: customer?.['cac:PostalAddress']?.['cbc:PostalZone'],
        country: customer?.['cac:PostalAddress']?.['cac:Country']?.['cbc:IdentificationCode'],
      },
      totals: {
        taxable: monetaryTotal?.['cbc:TaxExclusiveAmount']?.['#text'] || '0',
        tax: taxTotal?.['cbc:TaxAmount']?.['#text'] || '0',
        grand: monetaryTotal?.['cbc:TaxInclusiveAmount']?.['#text'] || '0',
        payable: monetaryTotal?.['cbc:PayableAmount']?.['#text'] || '0',
      },
      taxes,
      refs: {
        orderRef: invoice['cac:OrderReference']?.['cbc:ID'],
        contractRef: invoice['cac:ContractDocumentReference']?.['cbc:ID'],
        projectRef: invoice['cac:ProjectReference']?.['cbc:ID'],
        reportingRef: invoice['cbc:ReportingRef'],
      },
    };

    return header;
  }

  private extractLines(doc: ParsedUBL): UblLine[] {
    const invoice = doc.Invoice;
    const invoiceLines = invoice['cac:InvoiceLine'] || [];
    
    return invoiceLines.map((line: any): UblLine => {
      const taxInfo = line['cac:TaxTotal']?.['cac:TaxSubtotal'];
      
      return {
        lineNo: line['cbc:ID'] || '',
        itemName: line['cac:Item']?.['cbc:Name'],
        itemSku: line['cac:Item']?.['cac:SellersItemIdentification']?.['cbc:ID'],
        qty: parseFloat(line['cbc:InvoicedQuantity']?.['#text'] || '1'),
        unit: line['cbc:InvoicedQuantity']?.['@_unitCode'] || 'C62',
        unitPrice: line['cac:Price']?.['cbc:PriceAmount']?.['#text'] || '0',
        priceBaseQty: line['cac:Price']?.['cbc:BaseQuantity']?.['#text'] || '1',
        lineNet: line['cbc:LineExtensionAmount']?.['#text'] || '0',
        vatRate: parseFloat(taxInfo?.['cac:TaxCategory']?.['cbc:Percent'] || '0'),
        vatCategory: taxInfo?.['cac:TaxCategory']?.['cbc:ID'],
        vatAmount: taxInfo?.['cbc:TaxAmount']?.['#text'] || '0',
        lineAllowance: '0', // Simplified - would need to parse line-level allowances
        lineCharge: '0',    // Simplified - would need to parse line-level charges
        poLineRef: line['cac:DocumentReference']?.['cbc:ID'],
        costCenter: line['cac:Item']?.['cac:ClassifiedTaxCategory']?.['cbc:ID'],
        projectCode: line['cac:ProjectReference']?.['cbc:ID'],
      };
    });
  }

  private createFlattenedData(header: UblHeader, lines: UblLine[], options: {
    denormalized: boolean;
    taxColumns: boolean;
  }): any[] {
    const { denormalized, taxColumns } = options;

    if (!denormalized) {
      // Return lines as-is
      return lines.map(line => this.lineToFlatObject(line, taxColumns));
    }

    // Denormalized: repeat header data in each line
    return lines.map(line => ({
      // Header fields
      invoice_id: header.invoiceId,
      issue_date: header.issueDate,
      due_date: header.dueDate,
      currency: header.currency,
      profile: header.profile,
      type_code: header.typeCode,
      
      // Seller
      seller_name: header.seller.name,
      seller_vat_id: header.seller.vatId,
      seller_street: header.seller.street,
      seller_city: header.seller.city,
      seller_zip: header.seller.zip,
      seller_country: header.seller.country,
      
      // Buyer
      buyer_name: header.buyer.name,
      buyer_vat_id: header.buyer.vatId,
      buyer_street: header.buyer.street,
      buyer_city: header.buyer.city,
      buyer_zip: header.buyer.zip,
      buyer_country: header.buyer.country,
      
      // Totals
      total_taxable: formatDecimal(header.totals.taxable),
      total_tax: formatDecimal(header.totals.tax),
      total_grand: formatDecimal(header.totals.grand),
      total_payable: formatDecimal(header.totals.payable),
      
      // Line fields
      ...this.lineToFlatObject(line, taxColumns),
      
      // Tax columns (if requested)
      ...(taxColumns ? this.createTaxColumns(header.taxes) : {}),
    }));
  }

  private lineToFlatObject(line: UblLine, taxColumns: boolean): any {
    return {
      line_no: line.lineNo,
      item_name: line.itemName,
      item_sku: line.itemSku,
      quantity: line.qty,
      unit: line.unit,
      unit_price: formatDecimal(line.unitPrice),
      line_net: formatDecimal(line.lineNet),
      vat_rate: line.vatRate,
      vat_category: line.vatCategory,
      vat_amount: formatDecimal(line.vatAmount || parseDecimal('0')),
      po_line_ref: line.poLineRef,
      cost_center: line.costCenter,
      project_code: line.projectCode,
    };
  }

  private createTaxColumns(taxes: any[]): any {
    const taxCols: any = {};
    
    // Create columns for each unique tax rate
    for (const tax of taxes) {
      const rate = Math.round(tax.rate);
      taxCols[`vat_${rate}_base`] = formatDecimal(tax.taxable);
      taxCols[`vat_${rate}_amount`] = formatDecimal(tax.amount);
    }
    
    return taxCols;
  }

  private generateCSV(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    // Get all unique keys from all objects
    const allKeys = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    
    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private detectProfile(invoice: any): 'EN' | 'PEPPOL' | 'XRECHNUNG' {
    const customizationId = invoice['cbc:CustomizationID'];
    const profileId = invoice['cbc:ProfileID'];

    if (customizationId?.includes('xrechnung')) return 'XRECHNUNG';
    if (profileId?.includes('peppol')) return 'PEPPOL';
    return 'EN';
  }
}

// Export singleton instance
export const ublFlattener = new UBLFlattener();

// Export main flattening function
export async function flattenUbl(xml: string, options?: FlattenOptions): Promise<FlattenResult> {
  return ublFlattener.flattenUbl(xml, options);
}