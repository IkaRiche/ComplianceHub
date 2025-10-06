import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateUbl } from '../src/validator.js';

describe('UBL Validator', () => {
  const fixturesDir = '../../../tests/fixtures';
  
  it('should validate clean UBL invoice successfully', async () => {
    const xmlContent = readFileSync(join(__dirname, fixturesDir, 'ubl-clean.xml'), 'utf-8');
    
    const result = await validateUbl(xmlContent);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.meta.profile).toBe('PEPPOL');
  });

  it('should validate clean UBL with ViDA mode and get perfect score', async () => {
    const xmlContent = readFileSync(join(__dirname, fixturesDir, 'ubl-clean.xml'), 'utf-8');
    
    const result = await validateUbl(xmlContent, true);
    
    expect(result.valid).toBe(true);
    expect(result.meta.score).toBe(100);
    expect(result.meta.vidaCompliant).toBe(true);
    expect(result.meta.checklist).toBeDefined();
    expect(result.meta.checklist?.length).toBeGreaterThan(0);
  });

  it('should detect errors in dirty UBL invoice', async () => {
    const xmlContent = readFileSync(join(__dirname, fixturesDir, 'ubl-dirty.xml'), 'utf-8');
    
    const result = await validateUbl(xmlContent);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Check specific errors
    const errorIds = result.errors.map(e => e.id);
    expect(errorIds).toContain('BR-01'); // Missing CustomizationID
    expect(errorIds).toContain('BR-04'); // Missing IssueDate
    expect(errorIds).toContain('BR-13'); // 0% VAT without reason
    expect(errorIds).toContain('BR-15'); // Invalid VAT ID
  });

  it('should handle invalid XML gracefully', async () => {
    const invalidXml = '<invalid>not a UBL document</invalid>';
    
    await expect(validateUbl(invalidXml)).rejects.toThrow('Not a valid UBL Invoice document');
  });

  it('should handle malformed XML gracefully', async () => {
    const malformedXml = '<?xml version="1.0"?><Invoice><unclosed>';
    
    await expect(validateUbl(malformedXml)).rejects.toThrow();
  });
});

describe('UBL Rules', () => {
  it('should have 25 rules defined', async () => {
    const { liteRules } = await import('../src/rules.js');
    expect(liteRules).toHaveLength(25);
  });

  it('should include ViDA-specific rules', async () => {
    const { liteRules } = await import('../src/rules.js');
    const vidaRules = liteRules.filter(rule => rule.id.startsWith('V2-'));
    expect(vidaRules.length).toBeGreaterThan(0);
  });

  it('should include BIS 4.0 preview rules', async () => {
    const { liteRules } = await import('../src/rules.js');
    const bis4Rules = liteRules.filter(rule => rule.id.startsWith('BIS4-'));
    expect(bis4Rules.length).toBeGreaterThan(0);
  });
});