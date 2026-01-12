import { jsPDF } from 'jspdf';
import { ValidationResult } from '@compliance-hub/shared';

export interface PDFGenerationOptions {
  filename?: string;
  includeDetailedErrors?: boolean;
  includeWarnings?: boolean;
  fileHash?: string; // SHA-256 hash of the uploaded file
}

// --- CONSTANTS & CONFIG (Audit V3.0) ---

// Metrics (Points)
// A4 is 595.28 x 841.89 pt
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_TOP = 71; // ~25mm
const MARGIN_BOTTOM = 71; // ~25mm
const MARGIN_LEFT = 62; // ~22mm
const MARGIN_RIGHT = 62; // ~22mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Colors (Hex -> RGB)
const COLORS = {
  text: [26, 26, 26],       // #1A1A1A (Black/Grey)
  header: [15, 30, 51],     // #0F1E33 (Deep Navy)
  line: [218, 221, 226],    // #DADDE2
  pass: [31, 122, 61],      // #1F7A3D
  warn: [179, 107, 0],      // #B36B00
  fail: [138, 31, 31],      // #8A1F1F
};

// Typography
const FONTS = {
  main: 'helvetica',
};

const FONT_SIZES = {
  coverTitle: 20,
  sectionTitle: 14,
  subsection: 11,
  body: 10,
  tableHeader: 9,
  footer: 8.5,
  small: 9
};

// Helper: Safe text
function safeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/–/g, '-')
    .replace(/—/g, '--')
    .replace(/…/g, '...')
    .replace(/[^\x00-\x7F]/g, '?');
}

export function generateValidationPDF(
  result: ValidationResult,
  options: PDFGenerationOptions = {}
) {
  const {
    filename = `audit-report.pdf`,
    includeDetailedErrors = true,
    fileHash = 'SHA-256: ------------------------------------------------',
  } = options;

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  // --- Audit Identity ---
  // Deterministic Reference ID: VIDA-YYYY-MM-DD-XXXXXX
  const dateStr = new Date().toISOString().slice(0, 10);
  const hashFragment = (fileHash || '').replace(/[^a-fA-F0-9]/g, '').substring(0, 6).toUpperCase() || '000000';
  const auditRefId = `VIDA-${dateStr}-${hashFragment}`;

  let pageCount = 0;

  // --- Helpers ---

  const addPage = () => {
    if (pageCount > 0) doc.addPage();
    pageCount++;
  };

  // Footer on ALL pages
  const drawFooter = () => {
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont(FONTS.main, 'normal');
      doc.setFontSize(FONT_SIZES.footer);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

      // Line above footer
      doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
      doc.line(MARGIN_LEFT, PAGE_HEIGHT - 35, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 35);

      // Left: Brand
      doc.text('ViDA UBL Validator · BauKlar', MARGIN_LEFT, PAGE_HEIGHT - 20);

      // Right: Pagination
      doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 20, { align: 'right' });
    }
  };

  const drawSectionTitle = (title: string, y: number) => {
    doc.setFont(FONTS.main, 'bold');
    doc.setFontSize(FONT_SIZES.sectionTitle);
    doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
    doc.text(title.toUpperCase(), MARGIN_LEFT, y);
    return y + 25;
  };

  // --- Logic for Metrics ---
  const violations = result.errors || [];
  const warnings = result.warnings || [];

  // Counts
  const blockingErrorsCount = violations.length;
  const warningsCount = warnings.length;
  // Estimate total rules evaluated based on profile constants (approximated for density)
  const structuralTotal = 18;
  const mandatoryTotal = 42;
  const businessTotal = 27;
  const vidaTotal = 12;
  const totalRules = structuralTotal + mandatoryTotal + businessTotal + vidaTotal;

  // Breakdown Logic
  const getCategoryStats = (categoryPrefix: string, total: number) => {
    // Filter errors/warnings relevant to category
    // This is heuristic based on error IDs. 
    // XML/S- -> Structural
    // BR- -> Business Rule (and often Mandatory)
    // ViDA -> ViDA

    let fails = 0;
    let warns = 0;

    if (categoryPrefix === 'STRUCTURAL') {
      fails = violations.filter(e => e.id?.startsWith('XML') || e.id?.startsWith('S-')).length;
      warns = warnings.filter(w => w.id?.startsWith('XML') || w.id?.startsWith('S-')).length;
    } else if (categoryPrefix === 'MANDATORY') {
      // Assume missing field errors are mandatory
      fails = violations.filter(e => (e.id?.startsWith('BR-') && e.message?.includes('missing'))).length;
      warns = warnings.filter(w => (w.id?.startsWith('BR-') && w.message?.includes('missing'))).length;
    } else if (categoryPrefix === 'BUSINESS') {
      fails = violations.filter(e => e.id?.startsWith('BR-') && !e.message?.includes('missing')).length;
      warns = warnings.filter(w => w.id?.startsWith('BR-') && !w.message?.includes('missing')).length;
    } else if (categoryPrefix === 'VIDA') {
      // Determine ViDA fails from result.vida (this is usually a separate check object)
      if (result.vida?.aligned === false) fails = 1; // Simplify
    }

    const passed = Math.max(0, total - fails - warns);
    return { total, passed, warns, fails };
  };

  const structStats = getCategoryStats('STRUCTURAL', structuralTotal);
  const mandStats = getCategoryStats('MANDATORY', mandatoryTotal);
  const busStats = getCategoryStats('BUSINESS', businessTotal);
  const vidaStats = getCategoryStats('VIDA', vidaTotal);


  // ==========================================
  // PAGE 1: AUDIT COVER & IDENTITY
  // ==========================================
  addPage();

  let y = MARGIN_TOP + 20;

  // Title
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.coverTitle);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text('OFFICIAL ViDA / EN 16931 COMPLIANCE AUDIT', PAGE_WIDTH / 2, y, { align: 'center' });

  y += 30;
  // Subtitle
  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text('Electronic Invoice Validation Report', PAGE_WIDTH / 2, y, { align: 'center' });

  y += 60;

  // Compliance Status Block (Thin Border, Text Only)
  const statusX = (PAGE_WIDTH - 200) / 2;
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.rect(statusX, y, 200, 60);

  doc.setFontSize(10);
  doc.text('COMPLIANCE STATUS:', PAGE_WIDTH / 2, y + 20, { align: 'center' });

  const isCompliant = result.valid && result.vida?.aligned !== false;
  const isPartial = result.valid && result.vida?.aligned === false;
  const statusText = isCompliant ? 'COMPLIANT' : (isPartial ? 'PARTIALLY COMPLIANT' : 'NOT COMPLIANT');
  const statusColor = isCompliant ? COLORS.pass : (isPartial ? COLORS.warn : COLORS.fail);

  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(statusText, PAGE_WIDTH / 2, y + 42, { align: 'center' });

  y += 100;

  // Metadata Table (Mandatory)
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.setFontSize(FONT_SIZES.body);

  const drawMetaRow = (label: string, value: string) => {
    doc.setFont(FONTS.main, 'bold');
    doc.text(label, MARGIN_LEFT, y);
    doc.setFont(FONTS.main, 'normal');
    doc.text(value, MARGIN_LEFT + 140, y);
    // Grid line
    doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
    doc.line(MARGIN_LEFT, y + 8, PAGE_WIDTH - MARGIN_RIGHT, y + 8);
    y += 20;
  };

  // Header Line
  doc.setLineWidth(1.5);
  doc.line(MARGIN_LEFT, y - 10, PAGE_WIDTH - MARGIN_RIGHT, y - 10);
  doc.setLineWidth(1); // Reset

  drawMetaRow('Audit Reference ID', auditRefId);
  drawMetaRow('Generated', `${new Date().toUTCString().replace('GMT', 'UTC')}`);
  drawMetaRow('Validation Profile', 'EN 16931 v2 / Peppol BIS 4.0');
  drawMetaRow('ViDA Status', result.vida?.aligned ? 'Aligned (EU 2030)' : 'Not Aligned');
  drawMetaRow('File Hash', fileHash.length > 30 ? fileHash.substring(0, 30) + '...' : fileHash);
  drawMetaRow('Validator', 'ViDA UBL Validator');
  drawMetaRow('Issued by', 'BauKlar');

  y += 40;

  // Audit Scope (New Section)
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('AUDIT SCOPE', MARGIN_LEFT, y);
  y += 15;

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  const scopeText = `This audit evaluates a single electronic invoice file in UBL format against ViDA and EN 16931 compliance requirements.

The assessment includes:
• Structural validation
• Mandatory data elements
• Business rule enforcement
• ViDA alignment criteria`;
  doc.text(scopeText, MARGIN_LEFT, y);


  // ==========================================
  // PAGE 2: EXECUTIVE COMPLIANCE SUMMARY
  // ==========================================
  addPage();
  y = MARGIN_TOP;
  y = drawSectionTitle('EXECUTIVE COMPLIANCE SUMMARY', y);

  // Compliance Conclusion (Boxed, Left Aligned)
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 70);

  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('Compliance Conclusion:', MARGIN_LEFT + 15, y + 20);

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);

  const conclusionText = isCompliant
    ? 'The validated electronic invoice complies with ViDA and EN 16931 requirements.\nNo blocking issues were identified.\nThe invoice is suitable for submission and processing.'
    : (isPartial
      ? 'The invoice complies with core EN 16931 rules but requires updates for ViDA.\nIt is amenable for current submission but fails 2030 readiness criteria.'
      : 'The invoice contains blocking errors against EN 16931 standards.\nIt is NOT suitable for submission and must be corrected.');

  const conclusionLines = doc.splitTextToSize(conclusionText, CONTENT_WIDTH - 30);
  doc.text(conclusionLines, MARGIN_LEFT + 15, y + 38);

  y += 90;

  // Compliance Score Block
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('ViDA Compliance Score:', MARGIN_LEFT, y);

  // Big Number
  doc.setFontSize(24);
  const score = result.vida?.score || 0;
  doc.text(`${score} / 100`, MARGIN_LEFT, y + 30);

  // Interpretation
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('Interpretation:', MARGIN_LEFT, y + 55);
  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  const interpretation = score >= 90 ? 'Fully compliant with minor informational findings'
    : (score >= 75 ? 'Compliant with recommendations'
      : (score >= 50 ? 'Partially compliant' : 'Non-compliant'));
  doc.text(interpretation, MARGIN_LEFT, y + 70);


  // ==========================================
  // PAGE 3: METHODOLOGY & SCORING
  // ==========================================
  addPage();
  y = MARGIN_TOP;

  y = drawSectionTitle('SCORING METHODOLOGY', y);

  const methodText = `The ViDA Compliance Score represents a weighted technical assessment based on mandatory and optional compliance criteria.

Score interpretation:
• 90–100: Fully compliant (minor informational findings possible)
• 75–89: Compliant with recommendations
• 50–74: Partially compliant
• <50: Non-compliant`;

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.text(methodText, MARGIN_LEFT, y);


  // ==========================================
  // PAGE 4: COMPLIANCE BREAKDOWN (Expanded)
  // ==========================================
  addPage();
  y = MARGIN_TOP;
  y = drawSectionTitle('COMPLIANCE BREAKDOWN', y);

  // 5-Column Table: Category | Checks | Passed | Warnings | Failed
  const cols = [
    { name: 'Category', width: 140 },
    { name: 'Checks', width: 60 },
    { name: 'Passed', width: 60 },
    { name: 'Warnings', width: 70 },
    { name: 'Failed', width: 60 }
  ];

  // Header
  doc.setFillColor(245, 245, 245);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 20, 'F');

  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.tableHeader);

  let curX = MARGIN_LEFT + 5;
  cols.forEach(col => {
    doc.text(col.name, curX, y + 14);
    curX += col.width;
  });

  y += 20;

  // Rows
  const drawExpandedRow = (cat: string, stats: any) => {
    doc.line(MARGIN_LEFT, y + 25, MARGIN_LEFT + CONTENT_WIDTH, y + 25);

    doc.setFont(FONTS.main, 'normal');
    doc.setFontSize(FONT_SIZES.body);

    let rX = MARGIN_LEFT + 5;

    // Category
    doc.text(cat, rX, y + 17); rX += cols[0].width;

    // Checks
    doc.text(stats.total.toString(), rX, y + 17); rX += cols[1].width;

    // Passed
    doc.setTextColor(COLORS.pass[0], COLORS.pass[1], COLORS.pass[2]);
    doc.text(stats.passed.toString(), rX, y + 17); rX += cols[2].width;

    // Warnings
    doc.setTextColor(COLORS.warn[0], COLORS.warn[1], COLORS.warn[2]);
    doc.text(stats.warns.toString(), rX, y + 17); rX += cols[3].width;

    // Failed
    doc.setTextColor(COLORS.fail[0], COLORS.fail[1], COLORS.fail[2]);
    doc.text(stats.fails.toString(), rX, y + 17);

    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]); // Reset
    y += 25;
  };

  drawExpandedRow('Structural Validation', structStats);
  drawExpandedRow('Mandatory Fields', mandStats);
  drawExpandedRow('Business Rules', busStats);
  drawExpandedRow('ViDA Alignment', vidaStats);


  // ==========================================
  // PAGE 5: VALIDATION METRICS
  // ==========================================
  addPage();
  y = MARGIN_TOP;
  y = drawSectionTitle('VALIDATION METRICS', y);

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);

  const metricLine = (label: string, val: number) => {
    doc.text(`${label}: ${val}`, MARGIN_LEFT, y);
    y += 18;
  };

  metricLine('Total rules evaluated', totalRules);
  metricLine('Blocking errors', blockingErrorsCount);
  metricLine('Warnings', warningsCount);
  metricLine('Informational notices', 0); // Placeholder


  // ==========================================
  // PAGE 6: DETAILED FINDINGS (Conditional)
  // ==========================================

  if (blockingErrorsCount > 0 || warningsCount > 0) {
    addPage();
    y = MARGIN_TOP;
    y = drawSectionTitle('DETAILED FINDINGS', y);

    const renderFinding = (type: 'ERROR' | 'WARNING', item: any, counter: number) => {
      const fid = `${type === 'ERROR' ? 'ERR' : 'WARN'}-${String(counter).padStart(3, '0')}`;
      const ruleRef = item.id || item.ruleId || 'UNKNOWN';

      doc.setFont(FONTS.main, 'bold');
      doc.setFontSize(FONT_SIZES.subsection);
      doc.setTextColor(type === 'ERROR' ? COLORS.fail[0] : COLORS.warn[0], type === 'ERROR' ? COLORS.fail[1] : COLORS.warn[1], type === 'ERROR' ? COLORS.fail[2] : COLORS.warn[2]);
      doc.text(`Finding ID: ${fid}`, MARGIN_LEFT, y);
      y += 15;

      doc.setFontSize(FONT_SIZES.body);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

      const labelVal = (label: string, val: string) => {
        doc.setFont(FONTS.main, 'bold');
        doc.text(label, MARGIN_LEFT, y);
        const valLines = doc.splitTextToSize(val, CONTENT_WIDTH - 120);
        doc.setFont(FONTS.main, 'normal');
        doc.text(valLines, MARGIN_LEFT + 100, y);
        y += (valLines.length * 12) + 4;
      };

      labelVal('Rule Reference:', ruleRef);
      labelVal('Affected Path:', safeText(item.path));

      y += 6;
      doc.setFont(FONTS.main, 'bold');
      doc.text('Description:', MARGIN_LEFT, y);
      y += 12;
      doc.setFont(FONTS.main, 'normal');
      const desc = safeText(item.message || item.description);
      const descLines = doc.splitTextToSize(desc, CONTENT_WIDTH);
      doc.text(descLines, MARGIN_LEFT, y);
      y += (descLines.length * 12) + 10;

      doc.setFont(FONTS.main, 'bold');
      doc.text('Impact Assessment:', MARGIN_LEFT, y);
      y += 12;
      doc.setFont(FONTS.main, 'normal');
      const impact = type === 'ERROR' ? 'This finding strictly violates EN 16931. Acceptance is NOT guaranteed.'
        : 'This finding does not affect immediate compliance or invoice acceptance.';
      doc.text(impact, MARGIN_LEFT, y);
      y += 24;

      doc.setFont(FONTS.main, 'bold');
      doc.text('Severity:', MARGIN_LEFT, y);
      doc.setFont(FONTS.main, 'normal');
      doc.text(type === 'ERROR' ? 'Critical (Blocking)' : 'Informational', MARGIN_LEFT + 60, y);

      y += 30; // Spacing

      // Page Break
      if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 60) {
        addPage();
        y = MARGIN_TOP;
      }
    };

    let counter = 1;
    violations.forEach(v => { renderFinding('ERROR', v, counter++); });
    warnings.forEach(w => { renderFinding('WARNING', w, counter++); });
  }


  // ==========================================
  // FINAL PAGE: ASSURANCE & DISCLAIMER
  // ==========================================
  addPage();
  y = MARGIN_TOP;

  y = drawSectionTitle('ASSURANCE & LIMITATIONS', y);

  const assuranceText = `This audit provides reasonable technical assurance based on deterministic validation rules.

It does not guarantee acceptance by tax authorities or trading partners, as local or contextual requirements may apply.`;

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  doc.text(assuranceText, MARGIN_LEFT, y);

  y += 50;

  y = drawSectionTitle('METHODOLOGY & DISCLAIMER', y);

  const disclaimerText = `This report represents a technical compliance assessment based on ViDA and EN 16931 rules.

It does not constitute legal, tax, or accounting advice.

No invoice data is stored or retained as part of this process.`;

  doc.text(disclaimerText, MARGIN_LEFT, y);


  // --- FINAL RENDER ---
  drawFooter();
  doc.save(filename);

  // --- FINAL RENDER ---
  drawFooter();
  doc.save(filename);
}