import { jsPDF } from 'jspdf';
import { ValidationResult } from '@compliance-hub/shared';

export interface PDFGenerationOptions {
  filename?: string;
  includeDetailedErrors?: boolean;
  includeWarnings?: boolean;
  fileHash?: string; // SHA-256 hash of the uploaded file
}

// --- CONSTANTS & CONFIG (Audit V2.0) ---

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
  text: [26, 26, 26],       // #1A1A1A
  header: [15, 30, 51],     // #0F1E33
  line: [218, 221, 226],    // #DADDE2
  pass: [31, 122, 61],      // #1F7A3D
  warn: [179, 107, 0],      // #B36B00
  fail: [138, 31, 31],      // #8A1F1F
  white: [255, 255, 255],
};

// Typography
const FONTS = {
  main: 'helvetica',
};

const FONT_SIZES = {
  coverTitle: 20,
  sectionTitle: 14,
  subsection: 11.5,
  body: 10.5,
  tableHeader: 10,
  footer: 8.5,
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
    filename = `compliance-audit-${Date.now()}.pdf`,
    includeDetailedErrors = true,
    fileHash = 'SHA-256: ------------------------------------------------',
  } = options;

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  // State for page numbering
  let pageCount = 0;

  // --- Helpers ---

  const addPage = () => {
    if (pageCount > 0) doc.addPage();
    pageCount++;
  };

  const drawFooter = () => {
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont(FONTS.main, 'normal');
      doc.setFontSize(FONT_SIZES.footer);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

      // Left: Brand
      doc.text('ViDA UBL Validator · BauKlar', MARGIN_LEFT, PAGE_HEIGHT - 25);

      // Right: Pagination
      doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 25, { align: 'right' });
    }
  };

  const drawSectionTitle = (title: string, y: number) => {
    doc.setFont(FONTS.main, 'bold');
    doc.setFontSize(FONT_SIZES.sectionTitle);
    doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
    doc.text(title.toUpperCase(), MARGIN_LEFT, y);
    return y + 25; // Spacing after title
  };

  // --- Logic ---

  // Determine Status
  const isCompliant = result.valid && result.vida?.aligned !== false;
  const isPartial = result.valid && result.vida?.aligned === false;

  const statusText = isCompliant ? 'COMPLIANT' : (isPartial ? 'PARTIALLY COMPLIANT' : 'NOT COMPLIANT');
  const statusColor = isCompliant ? COLORS.pass : (isPartial ? COLORS.warn : COLORS.fail);

  // ==========================================
  // PAGE 1: COVER
  // ==========================================
  addPage();

  let y = MARGIN_TOP + 40;

  // Title
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.coverTitle);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text('OFFICIAL ViDA / EN 16931', PAGE_WIDTH / 2, y, { align: 'center' });
  doc.text('COMPLIANCE AUDIT', PAGE_WIDTH / 2, y + 25, { align: 'center' });

  y += 50;

  // Subtitle
  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(14); // Slightly larger than body
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text('Electronic Invoice Validation Report', PAGE_WIDTH / 2, y, { align: 'center' });

  y += 80;

  // Compliance Verdict (Framed Box)
  const boxWidth = 200;
  const boxHeight = 60;
  const boxX = (PAGE_WIDTH - boxWidth) / 2;

  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.setLineWidth(1); // Standard line
  doc.rect(boxX, y, boxWidth, boxHeight);

  // Verdict content
  doc.setFontSize(10);
  doc.text('COMPLIANCE STATUS:', PAGE_WIDTH / 2, y + 20, { align: 'center' });

  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]); // Status color
  doc.text(statusText, PAGE_WIDTH / 2, y + 42, { align: 'center' });

  y += 120;

  // Metadata Table
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]); // Reset text color
  doc.setFontSize(FONT_SIZES.body);

  const drawMetaRow = (label: string, value: string, currentY: number) => {
    doc.setFont(FONTS.main, 'bold');
    doc.text(label, MARGIN_LEFT + 20, currentY);
    doc.setFont(FONTS.main, 'normal');
    doc.text(value, MARGIN_LEFT + 150, currentY);
    // Line below
    doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
    doc.line(MARGIN_LEFT + 20, currentY + 10, PAGE_WIDTH - MARGIN_RIGHT - 20, currentY + 10);
    return currentY + 25;
  };

  y = drawMetaRow('Generated', `${new Date().toUTCString().split(' ').slice(0, 5).join(' ')} UTC`, y);
  y = drawMetaRow('Validation Profile', 'EN 16931 v2 / Peppol BIS 4.0', y);
  y = drawMetaRow('ViDA Status', result.vida?.aligned ? 'Aligned (EU 2030)' : 'Not Aligned', y);
  y = drawMetaRow('File Hash', fileHash.length > 30 ? fileHash.substring(0, 30) + '...' : fileHash, y);
  y = drawMetaRow('Validator', 'ViDA UBL Validator', y);
  y = drawMetaRow('Issued by', 'BauKlar', y);

  // Cover Footer Disclaimer
  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.footer);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text('This document represents an independent technical compliance assessment.', PAGE_WIDTH / 2, PAGE_HEIGHT - 60, { align: 'center' });


  // ==========================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ==========================================
  addPage();
  y = MARGIN_TOP;
  y = drawSectionTitle('EXECUTIVE COMPLIANCE SUMMARY', y);

  // Verdict Block (Framed box spanning width)
  const verdictHeight = 90;
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, verdictHeight);

  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('Compliance Conclusion:', MARGIN_LEFT + 15, y + 25);

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  const conclusionText = isCompliant
    ? 'The validated electronic invoice complies with ViDA and EN 16931 requirements. No blocking issues were identified. The invoice is suitable for submission and processing.'
    : (isPartial
      ? 'The invoice complies with core EN 16931 rules but has warnings regarding future ViDA alignment. It is valid for current submission but requires updates for 2030 compliance.'
      : 'The invoice contains critical errors violating EN 16931 standards. It is NOT valid for submission and must be corrected.'
    );

  const conclusionLines = doc.splitTextToSize(conclusionText, CONTENT_WIDTH - 30);
  doc.text(conclusionLines, MARGIN_LEFT + 15, y + 45);

  y += verdictHeight + 40;

  // Score Block
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('ViDA Compliance Score:', MARGIN_LEFT, y);

  doc.setFontSize(24);
  doc.text(`${result.vida?.score || 0} / 100`, MARGIN_LEFT, y + 35);

  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('Interpretation:', MARGIN_LEFT, y + 65);

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  const interpretation = (result.vida?.score || 0) === 100
    ? 'Fully aligned with ViDA requirements'
    : ((result.vida?.score || 0) > 80 ? 'High alignment, minor adjustments recommended' : 'Requires significant changes for ViDA compliance');
  doc.text(interpretation, MARGIN_LEFT, y + 85);


  // ==========================================
  // PAGE 3: COMPLIANCE BREAKDOWN
  // ==========================================
  addPage();
  y = MARGIN_TOP;
  y = drawSectionTitle('COMPLIANCE BREAKDOWN', y);

  // Table Logic
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);

  // Header
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.tableHeader);
  doc.setFillColor(245, 245, 245); // Very light gray header
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 20, 'F');
  doc.text('Category', MARGIN_LEFT + 10, y + 14);
  doc.text('Result', MARGIN_LEFT + 300, y + 14);

  y += 20;

  const violations = result.errors || [];
  const structuralPass = !violations.some(e => (e.id && (e.id.startsWith('XML') || e.id.startsWith('S-'))));
  const mandatoryPass = !violations.some(e => (e.id && e.id.startsWith('BR-')) || (e.message && e.message.toLowerCase().includes('missing')));
  const businessRulesPass = !violations.some(e => e.id && e.id.startsWith('BR-'));
  const vidaPass = result.vida?.aligned ?? false;

  const drawTableRow = (category: string, passed: boolean) => {
    // Bottom line
    doc.line(MARGIN_LEFT, y + 25, MARGIN_LEFT + CONTENT_WIDTH, y + 25);

    doc.setFont(FONTS.main, 'normal');
    doc.setFontSize(FONT_SIZES.body);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(category, MARGIN_LEFT + 10, y + 17);

    // Result Text
    const resText = passed ? 'Passed' : 'Failed';
    const resColor = passed ? COLORS.pass : COLORS.fail;

    doc.setFont(FONTS.main, 'bold');
    doc.setTextColor(resColor[0], resColor[1], resColor[2]);
    doc.text(resText, MARGIN_LEFT + 300, y + 17);

    y += 25;
  };

  drawTableRow('Structural Validation', structuralPass);
  drawTableRow('Mandatory Fields', mandatoryPass);
  drawTableRow('Business Rules', businessRulesPass);
  drawTableRow('ViDA Alignment', vidaPass);


  // ==========================================
  // PAGE 4: DETAILED FINDINGS (Conditional)
  // ==========================================

  const warnings = result.warnings || [];
  if (includeDetailedErrors && (violations.length > 0 || warnings.length > 0)) {
    addPage();
    y = MARGIN_TOP;
    y = drawSectionTitle('DETAILED FINDINGS', y);

    const renderFinding = (type: 'ERROR' | 'WARNING', item: any) => {
      const severity = type === 'ERROR' ? 'Critical' : 'Informational';
      const id = safeText(item.id || item.ruleId || 'N/A');
      const color = type === 'ERROR' ? COLORS.fail : COLORS.warn;

      // Heading
      doc.setFont(FONTS.main, 'bold');
      doc.setFontSize(FONT_SIZES.subsection);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(`${type === 'ERROR' ? 'Error' : 'Warning'} ${id}`, MARGIN_LEFT, y);
      y += 15;

      // Table-like structure for finding
      const drawField = (label: string, val: string) => {
        doc.setFont(FONTS.main, 'bold');
        doc.setFontSize(FONT_SIZES.body);
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        doc.text(label, MARGIN_LEFT, y);

        const valLines = doc.splitTextToSize(val, CONTENT_WIDTH - 100);
        doc.setFont(FONTS.main, 'normal');
        doc.text(valLines, MARGIN_LEFT + 100, y);

        y += (valLines.length * 12) + 6;
      };

      drawField('Path', safeText(item.path || 'N/A'));
      drawField('Description', safeText(item.message || item.description || 'No description'));
      drawField('Impact', type === 'ERROR' ? 'Blocks compliance' : 'Does not affect compliance');
      drawField('Severity', severity);

      y += 15; // Spacer between items

      // Page break check
      if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 50) {
        addPage();
        y = MARGIN_TOP;
      }
    };

    violations.forEach(v => renderFinding('ERROR', v));
    warnings.forEach(w => renderFinding('WARNING', w));
  }


  // ==========================================
  // LAST PAGE: LEGAL & METHODOLOGY
  // ==========================================
  // If plenty of space left on previous page, use it? Spec says "Last Page" but also "Separate section".
  // Let's force a new page if space is tight (< 200pt), otherwise use current.
  // Actually spec header says "LAST PAGE", implying a separate page usually. 
  // But strict interpretation: "LAST PAGE — LEGAL & METHODOLOGY".

  if (y > PAGE_HEIGHT / 2) {
    addPage();
    y = MARGIN_TOP;
  } else {
    y += 40;
  }

  // Divider
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  y += 30;

  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection); // Slightly smaller section title
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text('METHODOLOGY & DISCLAIMER', MARGIN_LEFT, y);
  y += 20;

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.footer); // Small text for legal
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

  const legalText = `This report represents a technical compliance assessment based on ViDA and EN 16931 rules.
It does not constitute legal, tax, or accounting advice.

The assessment is performed using deterministic validation rules.
No invoice data is stored or retained as part of this process.`;

  doc.text(legalText, MARGIN_LEFT, y);

  // --- FINAL RENDER ---
  drawFooter();
  doc.save(filename);
}