import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { flattenUbl } from '../src/flatten.js';

describe('UBL Flattener', () => {
  const fixturesDir = '../../../tests/fixtures';
  
  it('should flatten clean UBL invoice to CSV', async () => {
    const xmlContent = readFileSync(join(__dirname, fixturesDir, 'ubl-clean.xml'), 'utf-8');
    
    const result = await flattenUbl(xmlContent, { format: 'csv' });
    
    expect(result.csv).toBeDefined();
    expect(result.csv!.length).toBeGreaterThan(0);
    expect(result.meta.lineCount).toBe(1);
    expect(result.meta.currency).toBe('EUR');
    
    // Check CSV structure
    const lines = result.csv!.split('\n');
    expect(lines.length).toBeGreaterThan(1); // Header + data
    expect(lines[0]).toContain('invoice_id');
    expect(lines[1]).toContain('INV-2025-001');
  });

  it('should flatten clean UBL invoice to JSON', async () => {
    const xmlContent = readFileSync(join(__dirname, fixturesDir, 'ubl-clean.xml'), 'utf-8');
    
    const result = await flattenUbl(xmlContent, { format: 'json' });
    
    expect(result.json).toBeDefined();
    expect(result.json!.header).toBeDefined();
    expect(result.json!.lines).toBeDefined();
    expect(result.json!.lines).toHaveLength(1);
    
    const header = result.json!.header;
    expect(header.invoiceId).toBe('INV-2025-001');
    expect(header.currency).toBe('EUR');
    expect(header.profile).toBe('PEPPOL');
    
    const line = result.json!.lines[0];
    expect(line.lineNo).toBe('1');
    expect(line.itemName).toBe('Software License Premium');
    expect(line.qty).toBe(10);
  });

  it('should create denormalized output', async () => {
    const xmlContent = readFileSync(join(__dirname, fixturesDir, 'ubl-clean.xml'), 'utf-8');
    
    const result = await flattenUbl(xmlContent, { 
      format: 'csv',
      denormalized: true 
    });
    
    expect(result.csv).toBeDefined();
    const lines = result.csv!.split('\n');
    const headers = lines[0].split(',');
    
    // Should include header fields in each line
    expect(headers).toContain('invoice_id');
    expect(headers).toContain('seller_name');
    expect(headers).toContain('buyer_name');
    expect(headers).toContain('line_no');
  });

  it('should create tax columns when requested', async () => {
    const xmlContent = readFileSync(join(__dirname, fixturesDir, 'ubl-clean.xml'), 'utf-8');
    
    const result = await flattenUbl(xmlContent, { 
      format: 'csv',
      taxColumns: true 
    });
    
    expect(result.csv).toBeDefined();
    const lines = result.csv!.split('\n');
    const headers = lines[0].split(',');
    
    // Should include tax rate columns
    expect(headers.some(h => h.includes('vat_19'))).toBe(true);
  });

  it('should handle invalid XML gracefully', async () => {
    const invalidXml = '<invalid>not a UBL document</invalid>';
    
    await expect(flattenUbl(invalidXml)).rejects.toThrow();
  });

  it('should extract correct totals', async () => {
    const xmlContent = readFileSync(join(__dirname, fixturesDir, 'ubl-clean.xml'), 'utf-8');
    
    const result = await flattenUbl(xmlContent, { format: 'json' });
    
    const header = result.json!.header;
    expect(header.totals.taxable.toString()).toBe('1000');
    expect(header.totals.tax.toString()).toBe('190');
    expect(header.totals.payable.toString()).toBe('1190');
  });
});