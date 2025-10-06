import Decimal from 'decimal.js';

// Decimal utilities for precise calculations
export function parseDecimal(value: string | number | Decimal): Decimal {
  if (Decimal.isDecimal(value)) return value;
  return new Decimal(value);
}

export function formatDecimal(value: Decimal, precision = 2): string {
  return value.toFixed(precision);
}

export function sumDecimals(values: (string | number | Decimal)[]): Decimal {
  return values.reduce((sum: Decimal, val) => sum.add(parseDecimal(val)), new Decimal(0));
}

// Date utilities
export function parseISODate(dateStr: string): Date {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date: ${dateStr}`);
  }
  return date;
}

export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// XML utilities
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Validation utilities
export function isValidVATId(vatId: string): boolean {
  // Basic EU VAT ID validation: Country code (2 chars) + 2-12 alphanumeric
  return /^[A-Z]{2}[\w\d]{2,12}$/.test(vatId);
}

export function isValidIBAN(iban: string): boolean {
  // Basic IBAN format check (simplified)
  return /^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(iban.replace(/\s/g, ''));
}

// Percentage calculations
export function calculatePercentage(amount: Decimal, rate: number): Decimal {
  return amount.mul(rate).div(100);
}

export function calculateTaxExclusiveAmount(taxInclusiveAmount: Decimal, rate: number): Decimal {
  return taxInclusiveAmount.div(new Decimal(100).add(rate).div(100));
}